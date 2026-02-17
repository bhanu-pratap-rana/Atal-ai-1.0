"use client";

/**
 * Empty Modules Message Component
 *
 * Displays a translated message when no modules are available.
 */

import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export function EmptyModulesMessage() {
  const { t } = useLanguage();

  return (
    <Card className="p-6 text-center">
      <p className="text-text-secondary">{t("learn.loadingCurriculum")}</p>
    </Card>
  );
}
