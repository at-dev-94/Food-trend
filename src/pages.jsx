import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { classics, cities, digest, dimensions, getVenue, prompts, venues } from "./data";
import { interpret, recommend, tasteMatch } from "./engine";
import { Radar, Spark, VenueCard } from "./components";

function AskForm({ initial = "", compact = false }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      className={compact ? "ask ask-compact" : "ask"}
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        navigate(query ? `/ask?q=${encodeURIComponent(query)}` : "/ask");
      }}
    >
      <label htmlFor="q">Ask for food worth remembering</label>
      <div>
        <input id="q" name="q" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Somewhere punchy in Manchester, under £40…" />
        <button type="submit">Find</button>
      </div>
    </form>
  );
}

export function Home() {
  const featured = [...venues].sort((a, b) => b.mti - a.mti).slice(0, 3);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Taste intelligence · United Kingdom</p>
        <h1>
          Find the food you’ll still be <em>thinking about</em> tomorrow.
        </h1>
        <p className="lede">
          Most discovery ranks popularity. Memorable Taste reads sensory language, the dish people
          name twice, and the sentence that says they would go back. A search engine for food worth remembering.
        </p>
        <AskForm />
        <ul className="hero-stats">
          <li><strong>MTI</strong><span>Memorable Taste Index</span></li>
          <li><strong>6</strong><span>Radar signals</span></li>
          <li><strong>5</strong><span>City taste maps</span></li>
        </ul>
      </section>

      <section className="split">
        <article>
          <p className="kicker">Generic satisfaction</p>
          <h2>Great location. Lovely atmosphere. Service was excellent.</h2>
          <p>Hundreds of reviews can describe a night out and say nothing about the food. Star volume follows convenience and promotion.</p>
        </article>
        <article className="ink">
          <p className="kicker">Sensory memory</p>
          <h2>Butter-basted until the edges were almost caramelised. I thought about it the next morning.</h2>
          <p>Fewer reviews. Far more information. That is the difference the Taste Memory Radar is built to hear.</p>
        </article>
      </section>

      <section className="section">
        <header className="section-head">
          <p className="kicker">Taste Memory Radar</p>
          <h2>Six signals. Not one star.</h2>
        </header>
        <div className="dim-grid">
          {dimensions.map((d, i) => (
            <article key={d.key}>
              <span>0{i + 1}</span>
              <h3>{d.label}</h3>
              <p>{d.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-head">
          <p className="kicker">Go here. Order this.</p>
          <h2>Highest memory, this week.</h2>
          <Link to="/discover">All venues</Link>
        </header>
        <div className="grid-3">
          {featured.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      <section className="band">
        <div>
          <p className="kicker">Weekly habit</p>
          <h2>{digest.title}</h2>
          <p>Emerging dishes, a British classic, a hidden gem, and the plate worth the train.</p>
          <Link className="btn" to="/digest">Read {digest.issue}</Link>
        </div>
        <ol>
          {digest.items.slice(0, 4).map((item) => {
            const venue = getVenue(item.venueId);
            return (
              <li key={item.kind}>
                <span>{item.kind}</span>
                <strong>{venue.dish.name}</strong>
                <em>{venue.name}</em>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

export function Discover() {
  const [city, setCity] = useState("all");
  const [signal, setSignal] = useState("all");
  const list = venues.filter((v) => {
    if (city !== "all" && v.city !== city) return false;
    if (signal === "gem" && !v.hiddenGem) return false;
    if (signal === "journey" && !v.journey) return false;
    if (signal === "rising" && v.momentum < 75) return false;
    return true;
  });
  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">Discovery</p>
        <h1>Restaurants ranked by memory, not noise.</h1>
      </header>
      <div className="filters">
        <button className={city === "all" ? "on" : ""} onClick={() => setCity("all")}>All cities</button>
        {cities.map((c) => (
          <button key={c.id} className={city === c.name ? "on" : ""} onClick={() => setCity(c.name)}>{c.name}</button>
        ))}
        <span className="filter-gap" />
        {[
          ["all", "Any signal"],
          ["gem", "Hidden gems"],
          ["journey", "Worth the journey"],
          ["rising", "Rising taste"],
        ].map(([id, label]) => (
          <button key={id} className={signal === id ? "on" : ""} onClick={() => setSignal(id)}>{label}</button>
        ))}
      </div>
      <div className="grid-3">
        {list.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
      {list.length === 0 && <p className="empty">Nothing in this cut. Widen the filter.</p>}
    </section>
  );
}

export function Ask() {
  const [params] = useSearchParams();
  const initial = params.get("q") || "";
  const [thread, setThread] = useState(() => (initial ? [{ role: "you", text: initial }] : []));
  const [draft, setDraft] = useState("");

  const combined = thread.filter((m) => m.role === "you").map((m) => m.text).join(" ");
  const result = useMemo(() => (combined ? recommend(combined) : null), [combined]);

  function submit(text) {
    const next = text.trim();
    if (!next) return;
    setThread((t) => [...t, { role: "you", text: next }]);
    setDraft("");
  }

  const missing = result && !result.intent.city && result.intent.tastes.length === 0;

  return (
    <section className="page ask-page">
      <header className="page-head">
        <p className="kicker">Conversational discovery</p>
        <h1>Ask like a person who is hungry.</h1>
        <p>The engine reads place, budget, flavour and the kind of room — then returns three plates with unusually strong taste-memory signals.</p>
      </header>
      <div className="thread">
        {thread.length === 0 && (
          <div className="chips">
            {prompts.map((p) => (
              <button key={p} onClick={() => submit(p)}>{p}</button>
            ))}
          </div>
        )}
        {thread.map((m, i) => (
          <p key={i} className={m.role === "you" ? "bubble you" : "bubble"}>{m.text}</p>
        ))}
        {result && (
          <div className="reply">
            <p className="bubble">
              {missing
                ? "Tell me a city or a craving — smoky, a pie, somewhere worth the drive."
                : `Reading ${[
                    result.intent.city && result.intent.city[0].toUpperCase() + result.intent.city.slice(1),
                    result.intent.budget ? `under £${result.intent.budget}` : null,
                    result.intent.tastes.slice(0, 3).join(", "),
                    result.intent.journey ? "worth the journey" : null,
                    result.intent.hidden ? "low visibility" : null,
                  ].filter(Boolean).join(" · ") || "memorability"}. Three places with unusually strong taste-memory signals.`}
            </p>
            {!missing && (
              <div className="recs">
                {result.ranked.map(({ venue, reasons }, index) => (
                  <Link key={venue.id} to={`/venue/${venue.id}`} className="rec">
                    <span>0{index + 1}</span>
                    <div>
                      <h3>{venue.name}</h3>
                      <p>Why: independent mentions of {venue.dish.name.toLowerCase()}.</p>
                      <p className="profile">{venue.dish.flavours.join(" · ")}</p>
                      <p className="order">Order {venue.dish.name}</p>
                      {reasons.length > 0 && <p className="why">{reasons.join(" · ")}</p>}
                    </div>
                    <strong>{venue.mti}</strong>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="I want somewhere romantic but not formal…" />
        <button type="submit">Ask</button>
      </form>
    </section>
  );
}

export function Venue() {
  const { id } = useParams();
  const venue = getVenue(id);
  if (!venue) return <section className="page"><h1>Venue not in the index.</h1></section>;
  const rows = [
    ["Sensory density", venue.radar.sensory],
    ["Dish specificity", venue.radar.concentration],
    ["Distinctiveness", venue.radar.distinctiveness],
    ["Emotional recall", venue.radar.recall],
    ["Repeat intent", venue.radar.returnIntent],
    ["Momentum", venue.radar.velocity],
  ];
  return (
    <article className="venue">
      <header className="venue-hero" style={{ backgroundImage: `linear-gradient(to top, rgba(12,10,8,.72), rgba(12,10,8,.15)), url(${venue.image})` }}>
        <p className="kicker">{venue.type} · {venue.city}</p>
        <h1>{venue.name}</h1>
        <p>{venue.blurb}</p>
      </header>
      <div className="venue-layout">
        <section>
          <p className="kicker">Signature</p>
          <h2>{venue.dish.name}</h2>
          <dl className="facts">
            <div><dt>Protein</dt><dd>{venue.dish.protein}</dd></div>
            <div><dt>Method</dt><dd>{venue.dish.method}</dd></div>
            <div><dt>Sauce</dt><dd>{venue.dish.sauce}</dd></div>
            <div><dt>Agreement</dt><dd>{venue.dish.mentions} independent mentions · {venue.dish.confidence}</dd></div>
          </dl>
          <ul className="tags light">
            {venue.sensory.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          <div className="quotes">
            {venue.quotes.map((q) => (
              <blockquote key={q.text}>
                <p>“{q.text}”</p>
                <cite>{q.signal}</cite>
              </blockquote>
            ))}
          </div>
        </section>
        <aside>
          <p className="kicker">Memorable Taste Index</p>
          <p className="big-score">{venue.mti}</p>
          <Radar radar={venue.radar} />
          <ul className="bars">
            {rows.map(([label, value]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="bar"><i style={{ width: `${value}%` }} /></span>
                <em>{value}</em>
              </li>
            ))}
          </ul>
          <p className="kicker">Meaningful mentions</p>
          <Spark series={venue.series} />
          <p className="fine">Week 1 → {venue.series.at(-1)} taste mentions. Momentum {venue.momentum}. Visibility {venue.visibility}.</p>
        </aside>
      </div>
      {venue.personality && (
        <section className="personality">
          <p className="kicker">Personality profile</p>
          <div>
            {Object.entries(venue.personality).map(([k, v]) => (
              <article key={k}><h3>{k}</h3><p>{v}</p></article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export function Classics() {
  const [active, setActive] = useState(classics[0].id);
  const current = classics.find((c) => c.id === active);
  const list = venues.filter((v) => v.classic === active);
  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">British Classics Intelligence</p>
        <h1>Specific opinions about specific plates.</h1>
      </header>
      <div className="filters">
        {classics.map((c) => (
          <button key={c.id} className={active === c.id ? "on" : ""} onClick={() => setActive(c.id)}>{c.name}</button>
        ))}
      </div>
      <div className="classic-intro">
        <div>
          <p className="kicker">{current.kicker}</p>
          <h2>{current.line}</h2>
        </div>
        <ul>
          {current.traits.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
      <div className="grid-3">
        {list.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
      </div>
      {list.length === 0 && <p className="empty">This index is mapped. Dishes land as the language accumulates.</p>}
    </section>
  );
}

export function Gems() {
  const gems = [...venues].filter((v) => v.hiddenGem).sort((a, b) => b.mti - a.visibility - (a.mti - a.visibility));
  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">Hidden Regional Gem Scout</p>
        <h1>High taste. Low visibility.</h1>
        <p>A venue with thousands of mentions and bland language loses to a counter with fierce sensory density and a dish people agree on.</p>
      </header>
      <div className="gem-list">
        {gems.map((venue) => (
          <Link key={venue.id} to={`/venue/${venue.id}`} className="gem">
            <div>
              <p className="kicker">{venue.type}</p>
              <h2>{venue.name}</h2>
              <p>{venue.city} · {venue.dish.name}</p>
            </div>
            <div className="gem-meters">
              <label>Taste memory <b>{venue.mti}</b></label>
              <span className="bar"><i style={{ width: `${venue.mti}%` }} /></span>
              <label>Visibility <b>{venue.visibility}</b></label>
              <span className="bar muted"><i style={{ width: `${venue.visibility}%` }} /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Digest() {
  return (
    <section className="page digest">
      <header className="page-head">
        <p className="kicker">{digest.issue} · {digest.date}</p>
        <h1>{digest.title}</h1>
      </header>
      <div className="digest-grid">
        {digest.items.map((item, i) => {
          const venue = getVenue(item.venueId);
          return (
            <Link key={item.kind} to={`/venue/${venue.id}`} className={i === 0 ? "digest-card lead" : "digest-card"} style={{ backgroundImage: `linear-gradient(to top, rgba(12,10,8,.78), rgba(12,10,8,.05)), url(${venue.image})` }}>
              <span>{item.kind}</span>
              <h2>{venue.dish.name}</h2>
              <p>{item.note}</p>
              <em>{venue.name} · {venue.city}</em>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MapPage() {
  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">Regional food memory map</p>
        <h1>Taste clusters, not pin density.</h1>
      </header>
      <div className="city-grid">
        {cities.map((city) => {
          const list = venues.filter((v) => v.city === city.name);
          return (
            <article key={city.id} className="city">
              <header>
                <h2>{city.name}</h2>
                <span>{list.length} memories</span>
              </header>
              <ul className="clusters">
                {city.clusters.map((c) => <li key={c}>{c}</li>)}
              </ul>
              <div className="city-venues">
                {list.map((v) => (
                  <Link key={v.id} to={`/venue/${v.id}`}>
                    <strong>{v.name}</strong>
                    <span>{v.dish.name}</span>
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const flavourOptions = ["smoky", "spicy", "umami", "rich", "fermented", "gamey", "buttery", "tangy"];
const textureOptions = ["crispy", "comforting", "delicate"];
const experienceOptions = ["informal", "traditional", "experimental", "romantic", "destination"];

export function Taste() {
  const [flavours, setFlavours] = useState(["smoky", "fermented"]);
  const [experiences, setExperiences] = useState(["informal"]);
  const [city, setCity] = useState("all");
  function toggle(list, set, value) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }
  const matches = tasteMatch({ flavours: [...flavours, ...experiences.filter((e) => textureOptions.includes(e))], experiences, city });
  return (
    <section className="page">
      <header className="page-head">
        <p className="kicker">Personal taste graph</p>
        <h1>High taste match × high memory.</h1>
        <p>The profile remembers what you reach for — smoky, fermented, independent — and looks for plates with the same memory potential.</p>
      </header>
      <div className="taste-layout">
        <div>
          <p className="kicker">Flavour</p>
          <div className="filters">
            {flavourOptions.map((f) => (
              <button key={f} className={flavours.includes(f) ? "on" : ""} onClick={() => toggle(flavours, setFlavours, f)}>{f}</button>
            ))}
          </div>
          <p className="kicker">Texture</p>
          <div className="filters">
            {textureOptions.map((f) => (
              <button key={f} className={experiences.includes(f) ? "on" : ""} onClick={() => toggle(experiences, setExperiences, f)}>{f}</button>
            ))}
          </div>
          <p className="kicker">Experience</p>
          <div className="filters">
            {experienceOptions.map((f) => (
              <button key={f} className={experiences.includes(f) ? "on" : ""} onClick={() => toggle(experiences, setExperiences, f)}>{f}</button>
            ))}
          </div>
          <p className="kicker">City</p>
          <div className="filters">
            <button className={city === "all" ? "on" : ""} onClick={() => setCity("all")}>Anywhere</button>
            {cities.map((c) => (
              <button key={c.id} className={city === c.id ? "on" : ""} onClick={() => setCity(c.id)}>{c.name}</button>
            ))}
          </div>
        </div>
        <div className="grid-2">
          {matches.map(({ venue }) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
      </div>
    </section>
  );
}

export function useQueryCity() {
  return interpret;
}
