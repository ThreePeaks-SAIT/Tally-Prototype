
export default function InfoBanner() {
    return (
        <div className="mt-5 w-full rounded border border-warning/30 bg-warning-soft px-4 py-4 sm:px-5">

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

                <div className="flex items-start gap-3 min-w-0">

                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-warning/30 text-warning font-bold text-xl">
                        !
                    </div>

                    <div className="flex flex-col min-w-0 gap-1">
                        <p className="text-body font-semibold text-warning">
                            Costco Order due by 3pm
                        </p>

                        <p className="text-body-sm text-foreground break-words">
                            Update count now so today&apos;s order remains accurate
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="w-full sm:w-auto shrink-0 h-10 rounded border border-border bg-foreground px-4 text-body-sm text-surface font-semibold hover:bg-foreground-muted hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                >
                    Update Costco Count
                </button>

            </div>
        </div>
    );
}
