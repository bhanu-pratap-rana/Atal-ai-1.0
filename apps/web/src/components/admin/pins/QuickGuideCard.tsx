/**
 * QuickGuideCard Component
 * Displays instructions when no school is selected
 */

export function QuickGuideCard() {
  return (
    <div className="bg-cyan-lightest border-l-4 border-cyan p-4 rounded-lg">
      <div className="flex gap-3">
        <div className="flex-shrink-0 text-2xl">📚</div>
        <div>
          <h3 className="font-semibold text-cyan-darkest mb-2">
            How to manage school PINs
          </h3>
          <ol className="text-sm text-cyan-darkest space-y-1 list-decimal list-inside">
            <li>Search for a school by name or code</li>
            <li>Click on a school from the suggestions</li>
            <li>View the current PIN status</li>
            <li>Generate and rotate a new PIN if needed</li>
            <li>Copy the PIN to share with school staff</li>
          </ol>
          <p className="text-xs text-cyan mt-3 font-medium">
            💡 Tip: Generate a new PIN to help schools verify their identity
            during verification process.
          </p>
        </div>
      </div>
    </div>
  );
}
