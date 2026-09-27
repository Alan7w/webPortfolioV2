import type { Obyektivka } from "@/lib/content/schema";
import { OBY_FIELDS, OBY_LABELS } from "@/lib/content/obyektivka";

/**
 * The Uzbek "Ma’lumotnoma" (Obyektivka) in its conventional layout: Times, A4, photo top-right,
 * work history, then the relatives table on its own page.
 */
export function ObyektivkaDocument({ oby, photoSrc }: { oby: Obyektivka; photoSrc?: string }) {
  const L = OBY_LABELS[oby.script];
  const heading = L.relativesHeading;
  const title = oby.relativesTitle.trim();
  const titleMain = title.endsWith(heading) ? title.slice(0, -heading.length).trim() : title;

  const Pair = ({ k }: { k: keyof typeof L & keyof Obyektivka }) => (
    <div>
      <p className="font-bold">{L[k] as string}</p>
      <p>{(oby[k] as string) || "—"}</p>
    </div>
  );

  return (
    <article className="paper text-[12pt] leading-[1.3] text-black" data-paper="a4" style={{ fontFamily: '"Times New Roman", Times, var(--font-source-serif), serif' }}>
      <style>{`@page { size: A4; margin: 14mm 0; } @media print { .oby-body { padding-top: 0 !important; padding-bottom: 0 !important; } }`}</style>
      <div className="oby-body px-[20mm] py-[16mm]">
        <h1 className="text-center text-[14pt] font-bold tracking-wide">{L.title}</h1>
        <p className="mt-[6mm] text-center text-[13pt] font-bold">{oby.fullName}</p>

        {(oby.currentPositionDate || oby.currentPosition) && (
          <div className="mt-[6mm]">
            <p>{oby.currentPositionDate}</p>
            <p className="font-bold">{oby.currentPosition}</p>
          </div>
        )}

        <div className="mt-[5mm] grid grid-cols-[minmax(0,1fr)_32mm] gap-x-[6mm]">
          <div className="col-start-1 row-start-1 space-y-[3mm]">
            {OBY_FIELDS.map(([a, b]) =>
              b ? (
                <div key={a} className="grid grid-cols-2 gap-x-[6mm]">
                  <Pair k={a} />
                  <Pair k={b} />
                </div>
              ) : (
                <div key={a} className={a === "specialty" ? "grid grid-cols-2 gap-x-[6mm]" : ""}>
                  {a === "specialty" ? (
                    <>
                      <p className="font-bold">{L.specialty}</p>
                      <p>{oby.specialty || "—"}</p>
                    </>
                  ) : (
                    <Pair k={a} />
                  )}
                </div>
              ),
            )}
            {oby.extra
              .filter((x) => x.label || x.value)
              .map((x) => (
                <div key={x.id}>
                  <p className="font-bold">{x.label}</p>
                  <p>{x.value}</p>
                </div>
              ))}
          </div>
          <div className="col-start-2 row-start-1">
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoSrc} alt="" className="h-[40mm] w-[30mm] object-cover" />
            ) : (
              <div className="flex h-[40mm] w-[30mm] items-center justify-center border border-dashed border-neutral-400 text-center text-[9pt] text-neutral-500">3×4</div>
            )}
          </div>
        </div>

        <h2 className="mt-[8mm] text-center text-[13pt] font-bold">{L.work}</h2>
        <div className="mt-[3mm] space-y-[2.5mm]">
          {oby.work.map((row) => (
            <p key={row.id} className="avoid-break">
              {row.period} – {row.text}
              {/[.;]$/.test(row.text) ? "" : ";"}
            </p>
          ))}
        </div>

        {oby.relatives.length > 0 && (
          <section className="page-break pt-[6mm]">
            <h2 className="text-center font-bold">
              {titleMain}
              <br />
              {heading}
            </h2>
            <table className="mt-[4mm] w-full border-collapse text-center text-[11pt]">
              <thead>
                <tr>
                  {[L.relation, L.fullName, L.birth, L.workplace, L.address].map((h) => (
                    <th key={h} className="border border-black px-[2mm] py-[1.5mm] align-middle font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {oby.relatives.map((r) => (
                  <tr key={r.id} className="avoid-break">
                    <td className="border border-black px-[2mm] py-[2mm] font-bold">{r.relation}</td>
                    <td className="border border-black px-[2mm] py-[2mm] font-bold">{r.fullName}</td>
                    <td className="border border-black px-[2mm] py-[2mm]">{r.birth}</td>
                    <td className="border border-black px-[2mm] py-[2mm]">{r.work}</td>
                    <td className="border border-black px-[2mm] py-[2mm]">{r.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </article>
  );
}
