export default function Header({ title }: { title: string }) {
    return (
        <header className="header">
            <h1 className="header-title">{title}</h1>
        </header>
    );
}
