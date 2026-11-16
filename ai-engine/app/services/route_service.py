import math
import os
import requests
from typing import List, Dict, Any
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from app.models.route_model import RouteOptimizeRequest, RouteOptimizeResponse, RouteOptimizeData, OptimizedRouteDay, RouteStep

# 21개 글로벌 도시 한글/영문 ➔ GCS OSRM 지도 폴더 키 매핑 사전
CITY_TO_GCS_MAP = {
    # 아시아
    "서울": "seoul", "seoul": "seoul", "한국": "seoul",
    "도쿄": "kanto", "tokyo": "kanto", "kanto": "kanto", "일본": "kanto",
    "오사카": "kansai", "osaka": "kansai", "교토": "kansai", "kyoto": "kansai", "kansai": "kansai",
    "후쿠오카": "fukuoka", "fukuoka": "fukuoka",
    "오키나와": "okinawa", "okinawa": "okinawa",
    "방콕": "bangkok", "bangkok": "bangkok", "태국": "bangkok",
    "싱가포르": "singapore", "singapore": "singapore",
    "타이베이": "taipei", "taipei": "taipei", "대만": "taipei",
    "하노이": "hanoi", "hanoi": "hanoi", "베트남": "hanoi",
    "발리": "bali", "bali": "bali", "인도네시아": "bali",

    # 유럽
    "파리": "paris", "paris": "paris", "프랑스": "paris",
    "런던": "london", "london": "london", "영국": "london",
    "로마": "rome", "rome": "rome", "이탈리아": "rome",
    "바르셀로나": "barcelona", "barcelona": "barcelona", "스페인": "barcelona",
    "암스테르담": "amsterdam", "amsterdam": "amsterdam", "네덜란드": "amsterdam",
    "취리히": "zurich", "zurich": "zurich", "스위스": "zurich",
    "베를린": "paris", "독일": "paris",

    # 북미
    "뉴욕": "new_york", "new_york": "new_york", "new york": "new_york", "미국": "new_york",
    "로스앤젤레스": "los_angeles", "los_angeles": "los_angeles", "la": "los_angeles",
    "하와이": "hawaii", "hawaii": "hawaii",

    # 오세아니아
    "시드니": "sydney", "sydney": "sydney", "호주": "sydney",

    # 아프리카
    "카이로": "cairo", "cairo": "cairo", "이집트": "cairo"
}

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
        """GCS 지도 다운로드는 API 요청 시 지연을 방지하기 위해 실시간 요청에서는 스킵"""
        pass

    def _get_time_matrix(self, locations: List[Any], destination: str = "kanto") -> List[List[int]]:
        """OSRM API를 호출하여 이동 시간 행렬 생성, 미응답 시 하버사인 공식으로 0.001초 만에 즉시 계산"""
        # OSRM은 lng,lat 순서를 요구함
        coords = ";".join([f"{loc.lng},{loc.lat}" for loc in locations])
        osrm_base_url = os.getenv("OSRM_BASE_URL", "http://osrm-backend:5000")
        url = f"{osrm_base_url}/table/v1/driving/{coords}?annotations=duration"
        
        try:
            response = requests.get(url, timeout=0.8)
            if response.status_code == 200:
                data = response.json()
                destinations = data.get('destinations', [])
                if any(dest.get('distance', 0) > 10000 for dest in destinations):
                    raise ValueError("Coordinates are out of OSRM map bounds")
                
                durations_sec = data.get('durations', [])
                matrix = []
                for row in durations_sec:
                    matrix.append([math.ceil(val/60) if val is not None else 999 for val in row])
                return matrix
        except Exception:
            pass
            
        # Fallback: Haversine 공식 기반 즉각 계산 (지연 시간 0ms)
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
        
        time_matrix = self._get_time_matrix(all_locations, destination=getattr(request, 'destination', 'kanto'))
        
        # start_location의 service_time은 0이 아닌 실제 체류 시간으로 설정
        start_service_time = getattr(request.start_location, 'stay_duration_mins', 90)
        start_window = getattr(request.start_location, 'opening_hours', [540, 570])

        return {
            'time_matrix': time_matrix,
            'service_times': [start_service_time] + [p.stay_duration_mins for p in request.places_to_visit],
            'time_windows': [start_window] + [p.opening_hours for p in request.places_to_visit],
            'num_vehicles': 1,
            'depot': 0,
            'locations': all_locations
        }

    def _solve_tsp_with_ortools(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        사용자 제공 로직을 기반으로 한 OR-Tools VRPTW 해결 엔진
        """
        num_locs = len(data['time_matrix'])
        if num_locs <= 1:
            return {'nodes': [0], 'times': [data['time_windows'][0][0]]}

        manager = pywrapcp.RoutingIndexManager(num_locs, data['num_vehicles'], data['depot'])
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
            180,   # 허용 대기 시간 (slack: 일찍 도착했을 때 대기 허용)
            1440,  # 최대 누적 시간 (하루 24시간 = 1440분)
            False, # 시작 시 0에서 시작 여부 (False면 이전 노드 누적값 유지)
            'Time'
        )
        time_dimension = routing.GetDimensionOrDie('Time')

        # 영업시간/골든타임 시간창 제약 적용
        for location_idx, (open_t, close_t) in enumerate(data['time_windows']):
            index = manager.NodeToIndex(location_idx)
            time_dimension.CumulVar(index).SetRange(open_t, close_t)

        # 검색 파라미터 설정
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.time_limit.seconds = 3

        solution = routing.SolveWithParameters(search_parameters)
        
        # 엄격한 제약으로 해를 못 찾을 경우, 소프트 윈도우(09:00~23:00)로 1회 안전 완화 시도
        if not solution:
            print("⚠️ [OR-Tools] 엄격한 시간창 만족 불가 ➔ 소프트 시간창으로 완화하여 재탐색...")
            routing_soft = pywrapcp.RoutingModel(manager)
            cb_soft = routing_soft.RegisterTransitCallback(time_callback)
            routing_soft.SetArcCostEvaluatorOfAllVehicles(cb_soft)
            routing_soft.AddDimension(cb_soft, 360, 1440, False, 'Time')
            td_soft = routing_soft.GetDimensionOrDie('Time')
            for location_idx in range(num_locs):
                idx = manager.NodeToIndex(location_idx)
                if location_idx == 0:
                    td_soft.CumulVar(idx).SetRange(540, 600)
                else:
                    td_soft.CumulVar(idx).SetRange(540, 1380)
            solution = routing_soft.SolveWithParameters(search_parameters)
            if solution:
                time_dimension = td_soft
                routing = routing_soft

        # 결과 파싱
        if not solution:
            print("⚠️ [OR-Tools] 최적해 도출 실패, 단순 순차 배치로 대체합니다.")
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
        
        days_route = []
        places_per_day = math.ceil((len(nodes)-1) / max_days) if max_days > 0 else len(nodes) - 1
        
        for d in range(1, max_days + 1):
            start_idx = 1 + (d-1) * places_per_day
            end_idx = 1 + d * places_per_day
            day_nodes_idx = nodes[start_idx:end_idx]
            
            if not day_nodes_idx: break
            
            start_min = times[0] if times else 570
            start_h, start_m = divmod(int(start_min), 60)
            steps = [RouteStep(
                step=1, 
                place_id=getattr(all_locations[nodes[0]], 'place_id', "START_POINT"), 
                expected_arrival=f"{start_h%24:02d}:{start_m:02d}"
            )]
            
            for i, node_idx in enumerate(day_nodes_idx):
                arrival_min = times[start_idx + i] # 00:00 자정 기준 절대 분
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
