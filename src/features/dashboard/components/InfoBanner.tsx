export default function InfoBanner() {

    return (
        <div className="mt-5 w-3/4 mx-auto rounded border border-warning/30 bg-warning-soft px-4 py-3 text-body-sm font-semibold text-warning flex justify-between items-center">
            <div className="font-bold text-2xl">!</div>
            <div className="flex flex-col justify-center items-center">
                <p className="text-body">Costco Order due by 3pm</p>
                <p className="text-body-sm text-foreground">Update count now so today&#39;s order remains accurate</p>
            </div>
            <button className="h-9 rounded border border-border bg-foreground px-4 text-body-sm text-surface font-semibold hover:bg-foreground-muted hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Update Costco Count
            </button>
        </div>

    );
}