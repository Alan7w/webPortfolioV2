import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { studioEnabled } from "@/lib/studio/server";

export default function PreviewPage() {
  if (!studioEnabled()) return null;
  return <PreviewFrame />;
}
