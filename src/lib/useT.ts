import { useEngine } from "./engine-store";
import { dict, type DictKey, type Lang } from "./i18n";

export function useT() {
  const { lang } = useEngine();
  return (key: DictKey): string => {
    const table = (dict[lang as Lang] ?? dict.en) as Record<string, string>;
    return table[key] ?? (dict.en as Record<string, string>)[key] ?? key;
  };
}
