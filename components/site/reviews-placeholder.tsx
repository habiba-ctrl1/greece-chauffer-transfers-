import { Reveal } from "./reveal";

/**
 * Honest placeholder — no testimonials, ratings or review schema until real,
 * verifiable customer reviews exist. Replace this component then.
 */
export function ReviewsPlaceholder() {
  return (
    <section className="section--tight" aria-labelledby="exp-title">
      <div className="wrap">
        <Reveal className="reviews">
          <span className="rule" aria-hidden="true" />
          <p className="eyebrow">Your experience matters</p>
          <h2 id="exp-title" className="h2" style={{ fontSize: "clamp(2rem,1.4rem + 2.2vw,3.2rem)" }}>
            Built around <em>how it feels to travel.</em>
          </h2>
          <p className="lede">
            We are building a chauffeur experience around punctuality, comfort, communication and genuine hospitality.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
