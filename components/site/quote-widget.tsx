import { ArrowRight } from "./icons";

/**
 * Compact hero panel. A plain GET form → /contact, which pre-fills the full
 * multi-step quote form. Works without JS; no pricing is shown or implied.
 */
export function QuoteWidget() {
  return (
    <form className="qw" action="/contact#quote" method="get" aria-label="Start your quote request">
      <div className="qw-grid">
        <label>Pickup
          <input className="fld" name="pickup" placeholder="Airport, port or hotel" autoComplete="off" />
        </label>
        <label>Destination
          <input className="fld" name="destination" placeholder="Where to?" autoComplete="off" />
        </label>
        <label>Date
          <input className="fld" type="date" name="date" />
        </label>
        <label>Passengers
          <select className="fld" name="adults" defaultValue="2">
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}{i === 7 ? "+" : ""}</option>
            ))}
          </select>
        </label>
        <label>Vehicle preference
          <select className="fld" name="vehicle" defaultValue="">
            <option value="">No preference</option>
            <option>Sedan</option>
            <option>SUV</option>
            <option>Van</option>
            <option>Group transport</option>
          </select>
        </label>
      </div>
      <button className="btn btn-primary" type="submit">
        Get My Quote <ArrowRight />
      </button>
    </form>
  );
}
