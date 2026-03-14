export default function FloatingButton({ onClick }: { onClick?: () => void }) {
    return (
        <div className="floating-action-btn-container">
            <button className="floating-action-btn" onClick={onClick}>
                ✈️ 여행가기
            </button>
        </div>
    );
}
