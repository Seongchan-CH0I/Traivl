import math
import os
import requests
from typing import List, Dict, Any
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from app.models.route_model import RouteOptimizeRequest, RouteOptimizeResponse, RouteOptimizeData, OptimizedRouteDay, RouteStep

class RouteService:
    def __init__(self):
        pass

    async def optimize_route(self, request: RouteOptimizeRequest) -> RouteOptimizeResponse:
        """
        Google OR-Tools를 사용하여 제약 조건이 포함된 TSP를 해결합니다.
        """
        # 1. 데이터 모델 생성
        data = self._create_data_model(request)
        
        # 2. TSP 해결 (OR-Tools)
        solution_data = self._solve_tsp_with_ortools(data)
        
        # 3. 일차별로 경로 구성
        days_route = self._structure_solution(solution_data, data, request.max_days)
        
        return RouteOptimizeResponse(
            status="success",
            data=RouteOptimizeData(
                optimized_routes=days_route
            )
        )

    def _ensure_gcs_map_download(self, destination: str = "kanto"):
        """GCS 클라우드 스토리지에서 필요한 도시의 완성 지도를 온디맨드(핫스와핑)로 동적 다운로드"""
        try:
            from app.services.gcs_service import gcs_service
            city_code = destination.lower()
            if "tokyo" in city_code or "kyoto" in city_code or "japan" in city_code or "kanto" in city_code:
                city_code = "kanto"
            
            local_dir = f"data/maps/{city_code}"
            gcs_prefix = f"maps/{city_code}/"
            
            # GCS 버킷에 보관된 해당 도시 지도를 로컬 핫스와핑 캐시로 다운로드
            essential_files = ["kanto-latest.osrm", "kanto-latest.osrm.mldgr", "kanto-latest.osrm.fileIndex"]
            for fname in essential_files:
                gcs_path = f"{gcs_prefix}{fname}"
                local_path = os.path.join(local_dir, fname)
                gcs_service.download_file(gcs_path, local_path)
        except Exception as e:
            print(f"⚠️ [GCS Hot-swapping] 지도 동적 다운로드 로깅: {e}")

    def _get_time_matrix(self, locations: List[Any]) -> List[List[int]]:
        """OSRM API를 호출하여 실제 도로망 기반 이동 시간(분) 행렬 생성 (GCS 핫스와핑 지원)"""
        # GCS 클라우드 지도 핫스와핑 사전 점검
        self._ensure_gcs_map_download("kanto")
        
        # OSRM은 lng,lat 순서를 요구함
        coords = ";".join([f"{loc.lng},{loc.lat}" for loc in locations])
        osrm_base_url = os.getenv("OSRM_BASE_URL", "http://osrm-backend:5000")
        url = f"{osrm_base_url}/table/v1/driving/{coords}?annotations=duration"
        
        try:
            print(f"🚗 [Route] OSRM API({osrm_base_url})로 실제 이동 시간 계산 중...")
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                # OSRM 지도 영역을 벗어난 경우 (예: Kanto 외의 교토, 오키나와, 한국 등) 
                # 매우 먼 거리의 매핑 도로로 스냅되므로 snapping distance가 커집니다.
                # 임계값(10km) 초과 시 Haversine 직선거리 공식으로 안전하게 폴백합니다.
                destinations = data.get('destinations', [])
                if any(dest.get('distance', 0) > 10000 for dest in destinations):
                    print("⚠️ [Route] OSRM 스냅 거리가 너무 멉니다 (>10km). 지도 영역 밖이므로 Haversine 폴백을 실행합니다.")
                    raise ValueError("Coordinates are out of OSRM map bounds")
                
                durations_sec = data.get('durations', [])
                # 초를 분 단위로 변환 (최소 1분 보장)
                matrix = []
                for row in durations_sec:
                    matrix.append([math.ceil(val/60) if val is not None else 999 for val in row])
                return matrix
        except Exception as e:
            print(f"⚠️ [Route] OSRM API 호출 실패 또는 폴백 트리거됨 ({e}), 직선 거리(Haversine) 기반으로 대체합니다.")
            
        # Fallback: Haversine
        num = len(locations)
        matrix = [[0] * num for _ in range(num)]
        for i in range(num):
            for j in range(num):
                if i == j: continue
                dist = self._haversine_distance(locations[i].lat, locations[i].lng, locations[j].lat, locations[j].lng)
                matrix[i][j] = int(dist / 30 * 60) + 5 # 도심 평균 시속 30km 가정 + 주차/도보 5분
        return matrix

    def _create_data_model(self, request: RouteOptimizeRequest) -> Dict[str, Any]:
        """
        OR-Tools용 데이터 모델 생성
        """
        all_locations = [request.start_location] + request.places_to_visit
        
        time_matrix = self._get_time_matrix(all_locations)
        
        # start_location의 service_time은 0이 아닌 실제 체류 시간으로 설정
        start_service_time = getattr(request.start_location, 'stay_duration_mins', 90)

        return {
            'time_matrix': time_matrix,
            'service_times': [start_service_time] + [p.stay_duration_mins for p in request.places_to_visit],
            'time_windows': [(0, 1440)] + [p.opening_hours for p in request.places_to_visit],
            'num_vehicles': 1,
            'depot': 0,
            'locations': all_locations
        }

    def _solve_tsp_with_ortools(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        사용자 제공 로직을 기반으로 한 OR-Tools 해결 엔진
        """
        manager = pywrapcp.RoutingIndexManager(len(data['time_matrix']), data['num_vehicles'], data['depot'])
        routing = pywrapcp.RoutingModel(manager)

        # 시간 콜백: 이동 시간 + 서비스 시간
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data['time_matrix'][from_node][to_node] + data['service_times'][from_node]

        transit_callback_index = routing.RegisterTransitCallback(time_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Time Dimension 추가 (제약 조건)
        routing.AddDimension(
            transit_callback_index,
            60,    # 허용 대기 시간
            1440,  # 최대 누적 시간 (하루)
            False, # 시작 시 0에서 시작 여부 (False면 이전 노드 누적값 유지)
            'Time'
        )
        time_dimension = routing.GetDimensionOrDie('Time')

        # 영업시간 제약 적용
        for location_idx, (open_t, close_t) in enumerate(data['time_windows']):
            index = manager.NodeToIndex(location_idx)
            time_dimension.CumulVar(index).SetRange(open_t, close_t)

        # 검색 파라미터 설정
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )

        solution = routing.SolveWithParameters(search_parameters)
        
        # 결과 파싱
        if not solution:
            return None
            
        index = routing.Start(0)
        route_nodes = []
        arrival_times = []
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route_nodes.append(node_index)
            time_var = time_dimension.CumulVar(index)
            arrival_times.append(solution.Min(time_var))
            index = solution.Value(routing.NextVar(index))
            
        return {'nodes': route_nodes, 'times': arrival_times}

    def _structure_solution(self, solution_data: Dict[str, Any], data: Dict[str, Any], max_days: int) -> List[OptimizedRouteDay]:
        """
        해결된 경로를 API 응답 형식에 맞게 구조화
        """
        if not solution_data:
            return []
            
        nodes = solution_data['nodes']
        times = solution_data['times']
        all_locations = data['locations']
        
        # 현재는 모든 장소를 최적화된 순서대로 일차별로 나누어 배분
        # TODO: 실제 다중 날짜(VRP)로 고도화 가능
        days_route = []
        places_per_day = math.ceil((len(nodes)-1) / max_days)
        
        for d in range(1, max_days + 1):
            start_idx = 1 + (d-1) * places_per_day
            end_idx = 1 + d * places_per_day
            day_nodes_idx = nodes[start_idx:end_idx]
            
            if not day_nodes_idx: break
            
            steps = [RouteStep(step=1, place_id="START_POINT", expected_arrival="09:00")]
            
            for i, node_idx in enumerate(day_nodes_idx):
                arrival_min = times[start_idx + i] + (9*60) # 09:00 기준 보정
                h, m = divmod(int(arrival_min), 60)
                steps.append(RouteStep(
                    step=i+2,
                    place_id=getattr(all_locations[node_idx], 'place_id', "START_POINT"),
                    expected_arrival=f"{h%24:02d}:{m:02d}"
                ))
                
            days_route.append(OptimizedRouteDay(
                day=d,
                total_travel_time_mins=int(times[end_idx-1] if end_idx <= len(times) else times[-1]),
                route=steps
            ))
            
        return days_route

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

route_service = RouteService()
