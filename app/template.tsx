"use client";

import { useEffect, useState } from "react";

/**
 * Route-change transition (plan §19.2: "route loading feedback" is permitted
 * motion).
 *
 * `template.tsx` remounts on every navigation, which is exactly the hook a
 * transition needs. Two deliberate constraints:
 *
 * 1. **Nothing animates on the first load.** An element at `opacity: 0` has not
 *    painted, so a fade-in on initial render would push Largest Contentful
 *    Paint out by the full duration of the animation. The module-level flag
 *    survives remounts within the session, so the animation applies only from
 *    the second view onward. It is `false` during server rendering, so the
 *    exported HTML and the first client render agree.
 *
 * 2. **Opacity only, never transform.** A transformed ancestor becomes the
 *    containing block for `position: fixed` descendants, which would tear the
 *    reading-progress bar out of the viewport for the length of the animation.
 */
let hasNavigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => hasNavigated);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return (
    <div className={animate ? "route-view route-view--enter" : "route-view"}>{children}</div>
  );
}
