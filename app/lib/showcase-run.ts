import { cache } from "react";

import { analyze } from "./k0";
import { SHOWCASE_SAMPLES, type ShowcaseVariant } from "./k0/showcase-samples";

/*
 * Vitrindeki koşum, istek başına TEK KEZ.
 *
 * Kadran, cümle şeridi ve bulgu rafı aynı nesneyi okuyor. Üç ayrı `analyze()`
 * çağrısı da aynı sonucu verirdi — motor deterministik — ama "kadrandaki nokta
 * ile cümledeki işaret AYNI ÖLÇÜMDEN geliyor" iddiası o zaman rastlantıya
 * dayanırdı. Burada koda dayanıyor.
 *
 * `app/lib/k0/` altında DEĞİL: orası `node --test` ile koşuluyor ve React
 * bağımlılığı görmemeli.
 */
export const showcaseAnalysis = cache((variant: ShowcaseVariant = "broken") => {
  const text = SHOWCASE_SAMPLES[variant];
  return { ...analyze(text), text };
});
