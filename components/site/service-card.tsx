import Link from "next/link";
import { Photo } from "./photo";
import { ArrowRight, ServiceIcon } from "./icons";
import { img, type Service } from "@/lib/site/content";

export function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <Link href={`/services/${service.slug}`} className="tile">
      <Photo
        src={img(service.image)}
        alt={`${service.title} — illustrative image`}
        sizes="(min-width: 760px) 55vw, 100vw"
      />
      <ServiceIcon name={service.icon} className="ic" />
      <div className="tile-in">
        <span className="num">{String(index + 1).padStart(2, "0")}</span>
        <h3>{service.title}</h3>
        <p>{service.short}</p>
        <span className="go">{service.cta} <ArrowRight /></span>
      </div>
    </Link>
  );
}
