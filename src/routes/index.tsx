import { createFileRoute } from "@tanstack/react-router";
import AssetsPanel from "@/components/studio/AssetsPanel";
import Inspector from "@/components/studio/Inspector";
import Timeline from "@/components/studio/Timeline";
import TopBar from "@/components/studio/TopBar";
import Viewport from "@/components/studio/Viewport";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kinetiq Motion Studio — 3D Rigging, Skinning & Mocap" },
      {
        name: "description",
        content:
          "Professional browser studio for skeletal animation, procedural rig building, material/skin authoring and BVH motion-capture retargeting.",
      },
      { property: "og:title", content: "Kinetiq Motion Studio — 3D Rigging, Skinning & Mocap" },
      {
        property: "og:description",
        content:
          "Build custom skeletons, animate rigs, author skins and retarget motion capture in the browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

function Studio() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">Kinetiq Motion Studio</h1>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <AssetsPanel />
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Viewport />
          </div>
          <Timeline />
        </section>
        <Inspector />
      </div>
    </main>
  );
}
