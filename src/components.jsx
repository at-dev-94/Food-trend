import { Link, NavLink, Outlet } from "react-router-dom";

const links = [
  ["Discover", "/discover"],
  ["Ask", "/ask"],
  ["Classics", "/classics"],
  ["Gems", "/gems"],
  ["Journey", "/journey"],
  ["Digest", "/digest"],
  ["Map", "/map"],
  ["Taste", "/taste"],
  ["Membership", "/membership"],
];

export default function Shell() {
  return (
    <>
      <header className="nav">
        <Link to="/" className="mark">
          <span className="mark-dot" aria-hidden />
          Memorable Taste
        </Link>
        <nav>
          {links.map(([label, to]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="foot">
        <div>
          <strong>Memorable Taste</strong>
          <p>Don’t follow the crowd. Find the taste people remember.</p>
        </div>
        <p className="fine">
          Memorable Taste Index — sensory language, dish agreement, emotional recall, return intent and momentum. Popularity is not the ranking.
        </p>
      </footer>
    </>
  );
}

export function VenueCard({ venue }) {
  return (
    <Link to={`/venue/${venue.id}`} className="card">
      <div className="card-photo" style={{ backgroundImage: `url(${venue.image})` }}>
        <span className="mti">{venue.mti}</span>
      </div>
      <div className="card-body">
        <p className="kicker">
          {venue.city} · {venue.area}
        </p>
        <h3>{venue.name}</h3>
        <p className="dish-name">Order {venue.dish.name}</p>
        <ul className="tags">
          {venue.sensory.slice(0, 4).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="card-meta">
          <span>{venue.priceBand} · under £{venue.ceiling}</span>
          <span>{venue.hiddenGem ? "Hidden gem" : venue.journey ? "Worth the journey" : venue.type}</span>
        </div>
      </div>
    </Link>
  );
}

export function Radar({ radar }) {
  const keys = ["sensory", "distinctiveness", "concentration", "recall", "returnIntent", "velocity"];
  const labels = ["Sensory", "Distinct", "Dish", "Recall", "Return", "Velocity"];
  const cx = 120;
  const cy = 120;
  const r = 78;
  const pt = (i, value) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / keys.length;
    const radius = (value / 100) * r;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  };
  const polygon = keys
    .map((key, i) => pt(i, radar[key]).join(","))
    .join(" ");
  const rings = [0.35, 0.62, 1];
  return (
    <svg className="radar" viewBox="0 0 240 240" role="img" aria-label="Taste memory radar">
      {rings.map((scale) => (
        <polygon
          key={scale}
          className="ring"
          points={keys
            .map((_, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / keys.length;
              return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
            })
            .join(" ")}
        />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="spoke" />;
      })}
      <polygon className="fill" points={polygon} />
      {labels.map((label, i) => {
        const [x, y] = pt(i, 118);
        return (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export function Spark({ series }) {
  const max = Math.max(...series);
  const w = 220;
  const h = 64;
  const step = w / (series.length - 1);
  const d = series
    .map((n, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (n / max) * (h - 8) - 4}`)
    .join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={d} />
    </svg>
  );
}
