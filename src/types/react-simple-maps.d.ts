// Ambient declaration for react-simple-maps — the upstream library
// doesn't ship types and there's no @types/react-simple-maps that
// matches v3. Loose typing is fine here: we use a small subset
// (ComposableMap, Geographies, Geography, ZoomableGroup) and the
// callsites already cast props via `any`-style usage.
//
// If this becomes a maintenance burden, swap to @types/react-simple-maps
// when one is published for v3 or migrate to react-leaflet.
declare module "react-simple-maps" {
  import type { ComponentType, ReactNode } from "react";

  type AnyProps = Record<string, any> & { children?: ReactNode };

  export const ComposableMap: ComponentType<AnyProps>;
  export const Geographies: ComponentType<AnyProps>;
  export const Geography: ComponentType<AnyProps>;
  export const ZoomableGroup: ComponentType<AnyProps>;
  export const Marker: ComponentType<AnyProps>;
  export const Sphere: ComponentType<AnyProps>;
  export const Graticule: ComponentType<AnyProps>;
  export const Line: ComponentType<AnyProps>;
  export const Annotation: ComponentType<AnyProps>;
}
