import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { CONTRACTORS, type Contractor } from "@/lib/contractors";

export const metadata = {
  title: "Trusted Contractors · Hodlin Family Hub",
};

/** Strip formatting from a phone number for a tel: link. */
function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function ContractorCard({ c }: { c: Contractor }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{c.name}</h3>
        <Badge>{c.category}</Badge>
      </div>
      {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}

      <dl className="mt-4 space-y-2 text-sm">
        {c.phone && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Phone</dt>
            <dd>
              <a href={telHref(c.phone)} className="font-medium text-accent hover:underline">
                {c.phone}
              </a>
              {c.altPhone && (
                <>
                  {" · "}
                  <a href={telHref(c.altPhone)} className="text-accent hover:underline">
                    {c.altPhone}
                  </a>
                </>
              )}
            </dd>
          </div>
        )}
        {c.email && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Email</dt>
            <dd>
              <a href={`mailto:${c.email}`} className="text-accent hover:underline">
                {c.email}
              </a>
            </dd>
          </div>
        )}
        {c.website && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Website</dt>
            <dd>
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {c.website.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </div>
        )}
        {c.address && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Address</dt>
            <dd>{c.address}</dd>
          </div>
        )}
        {c.notes && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Notes</dt>
            <dd>{c.notes}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

export default function ContractorsPage() {
  // Group by category so similar trades sit together.
  const byCategory = new Map<string, Contractor[]>();
  for (const c of CONTRACTORS) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <PageHeader
        title="Trusted Contractors 🧰"
        description="Pros we've vetted and would hire again — well & water, carpentry, landscaping, handyman, and more."
      />

      {CONTRACTORS.length === 0 ? (
        <EmptyState
          emoji="🧰"
          title="No contractors yet"
          description="As we find people we trust for the house, we'll keep their contact info here."
        />
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {byCategory.get(category)!.map((c) => (
                  <ContractorCard key={c.name} c={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
