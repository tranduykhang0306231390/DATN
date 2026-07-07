// src/components/admin/DashboardSection.jsx
import MenuCard from './MenuCard';


export default function DashboardSection({ eyebrow, title, items = [] }) {
    return (
        <section className="admin-section">
            <header className="admin-section-head">
                {eyebrow && <span className="admin-section-eyebrow">{eyebrow}</span>}
                <h3 className="admin-section-title">{title}</h3>
            </header>

            <div className="admin-grid">
                {items.map((item) => (
                    <MenuCard key={item.path} {...item} />
                ))}
            </div>
        </section>
    );
}