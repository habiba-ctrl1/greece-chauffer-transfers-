import Link from "next/link";
import type { ReactNode } from "react";
import { Photo } from "../photo";
import { Reveal } from "../reveal";
import { ArrowRight, Check } from "../icons";
import { SectionHeading } from "../section-heading";
import { Steps } from "./steps";
import { DESTINATIONS, FLEET, img } from "@/lib/site/content";
import type { Block, Head, Tone } from "@/lib/site/services/types";

const TONE: Record<Tone, string> = { ivory: "", white: "on-white", sand: "on-sand", navy: "on-navy" };

function Shell({ tone, head, children, id }: { tone: Tone; head?: Head; children: ReactNode; id?: string }) {
  return (
    <section className={`section ${TONE[tone]}`} aria-labelledby={head ? `${id}-t` : undefined}>
      <div className="wrap">
        {head && (
          <SectionHeading id={`${id}-t`} eyebrow={head.eyebrow} lede={head.intro}>
            {head.title} {head.em && <em>{head.em}</em>}
          </SectionHeading>
        )}
        {children}
      </div>
    </section>
  );
}

function Split({ b, id }: { b: Extract<Block, { type: "split" }>; id: string }) {
  return (
    <section className={`section ${TONE[b.tone]}`} aria-labelledby={`${id}-t`}>
      <div className="wrap sp2">
        <Reveal className="sp2-head">
          <p className="eyebrow">{b.head.eyebrow}</p>
          <h2 id={`${id}-t`} className="h2">{b.head.title} {b.head.em && <em>{b.head.em}</em>}</h2>
        </Reveal>
        <Reveal className="sp2-body" delay={120}>
          {b.body.map((p) => (<p key={p}>{p}</p>))}
          {b.bullets && (
            <ul className="ticks">
              {b.bullets.map((x) => (<li key={x}><Check />{x}</li>))}
            </ul>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function Cards({ b, id }: { b: Extract<Block, { type: "cards" }>; id: string }) {
  if (b.variant === "ruled") {
    return (
      <Shell tone={b.tone} head={b.head} id={id}>
        <ol className="ruled">
          {b.cards.map((c, i) => (
            <Reveal as="li" key={c.t} delay={(i % 3) * 60}>
              <span className="idx">{String(i + 1).padStart(2, "0")}</span>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
              {c.href ? <Link className="link-arrow" href={c.href}>{c.hrefLabel ?? c.t} <ArrowRight /></Link> : <span />}
            </Reveal>
          ))}
        </ol>
      </Shell>
    );
  }
  if (b.variant === "plain") {
    return (
      <Shell tone={b.tone} head={b.head} id={id}>
        <div className="pcards">
          {b.cards.map((c, i) => (
            <Reveal key={c.t} className="pc" delay={(i % 3) * 70}>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </Reveal>
          ))}
        </div>
      </Shell>
    );
  }
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <div className="rcards">
        {b.cards.map((c, i) => (
          <Reveal key={c.t + c.tag} className="rc" delay={(i % 3) * 70}>
            {c.tag && <p className="tag">{c.tag}</p>}
            <h3>{c.t}</h3>
            <p>{c.d}</p>
            {c.href ? <Link className="link-arrow" href={c.href}>{c.hrefLabel ?? c.t} <ArrowRight /></Link> : null}
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

function Compare({ b, id }: { b: Extract<Block, { type: "compare" }>; id: string }) {
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <div className="cmp" style={{ ["--cols" as string]: b.columns.length }}>
        {b.columns.map((c) => (
          <Reveal key={c.label} className={`cmp-col ${c.highlight ? "hl" : ""}`}>
            <p className="eyebrow">{c.label}</p>
            <h3>{c.title}</h3>
            <ul>{c.lines.map((l) => (<li key={l}>{l}</li>))}</ul>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

function Vehicles({ b, id }: { b: Extract<Block, { type: "vehicles" }>; id: string }) {
  const list = b.ids.map((i) => FLEET.find((f) => f.id === i)).filter((v): v is NonNullable<typeof v> => !!v);
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <div className="vrow">
        {list.map((v) => (
          <article key={v.id} className="vcard">
            <Photo src={img(v.image)} alt={`${v.name}: illustrative image`} sizes="(min-width:1000px) 24vw, 70vw" />
            <div className="vcard-in">
              <h3>{v.name}</h3>
              <p>{v.bestFor}</p>
              <Link className="link-arrow" href={`/contact?vehicle=${encodeURIComponent(v.name)}#quote`}>Quote this vehicle <ArrowRight /></Link>
            </div>
          </article>
        ))}
      </div>
      <p className="fine">
        {b.note ?? "Vehicle categories are indicative; your quote confirms the exact vehicle."}{" "}
        <Link href="/#fleet" className="link-arrow">See the fleet overview</Link>
      </p>
    </Shell>
  );
}

function Ports({ b, id }: { b: Extract<Block, { type: "ports" }>; id: string }) {
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <ul className="ports">
        {b.ports.map((p) => (
          <Reveal as="li" key={p.name}>
            <h3>{p.name}</h3>
            <span className="badge">{p.status}</span>
            <p>{p.note}</p>
            {p.href ? <Link className="link-arrow" href={p.href}>{p.name} chauffeur service <ArrowRight /></Link> : <span />}
          </Reveal>
        ))}
      </ul>
    </Shell>
  );
}

function Tours({ b, id }: { b: Extract<Block, { type: "tours" }>; id: string }) {
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <div className="tcards">
        {b.tours.map((t) => (
          <article key={t.name} className="tcard">
            <Photo src={img(t.image)} alt={`${t.name}: illustrative image`} sizes="(min-width:1000px) 24vw, 78vw" />
            <div className="tcard-in">
              <h3>{t.name}</h3>
              <dl>
                <div><dt>Suggested duration</dt><dd>{t.duration}</dd></div>
                <div><dt>Starts from</dt><dd>{t.start}</dd></div>
                <div><dt>Transport</dt><dd>Private vehicle</dd></div>
              </dl>
              <ul>{t.highlights.map((h) => (<li key={h}>{h}</li>))}</ul>
              <div className="tlinks">
                <Link className="link-arrow" href={`/contact?service=tour&destination=${encodeURIComponent(t.name)}#quote`}>Plan this tour <ArrowRight /></Link>
                {t.slug && <Link href={`/destinations/${t.slug}`}>About {t.name.split(" ")[0] === "Athens" ? "Athens" : t.name}</Link>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {b.note && <p className="fine">{b.note}</p>}
    </Shell>
  );
}

function Destinations({ b, id }: { b: Extract<Block, { type: "destinations" }>; id: string }) {
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <div className="drow">
        {b.items.map((it) => {
          const d = DESTINATIONS.find((x) => x.slug === it.slug);
          if (!d) return null;
          return (
            <Link key={d.slug} href={`/destinations/${d.slug}`} className="dest">
              <Photo src={img(d.image)} alt={`${d.name}: illustrative image`} sizes="(min-width:1000px) 22vw, 70vw" />
              <div className="dest-in"><h3>{d.name}</h3><p>{it.note}</p></div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}

function Partners({ b, id }: { b: Extract<Block, { type: "partners" }>; id: string }) {
  return (
    <Shell tone={b.tone} head={b.head} id={id}>
      <ul className="chips">{b.who.map((w) => (<li key={w}>{w}</li>))}</ul>
      <Link className="btn btn-primary" href={b.cta.href} style={{ marginTop: 24 }}>{b.cta.label} <ArrowRight /></Link>
    </Shell>
  );
}

export function ServiceBlocks({ blocks, slug }: { blocks: Block[]; slug: string }) {
  return (
    <>
      {blocks.map((b, i) => {
        const id = `${slug}-${i}`;
        switch (b.type) {
          case "split": return <Split key={id} b={b} id={id} />;
          case "steps": return <Shell key={id} tone={b.tone} head={b.head} id={id}><Steps steps={b.steps} /></Shell>;
          case "cards": return <Cards key={id} b={b} id={id} />;
          case "compare": return <Compare key={id} b={b} id={id} />;
          case "vehicles": return <Vehicles key={id} b={b} id={id} />;
          case "ports": return <Ports key={id} b={b} id={id} />;
          case "tours": return <Tours key={id} b={b} id={id} />;
          case "destinations": return <Destinations key={id} b={b} id={id} />;
          case "partners": return <Partners key={id} b={b} id={id} />;
        }
      })}
    </>
  );
}
