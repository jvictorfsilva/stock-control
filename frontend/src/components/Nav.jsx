import React from "react";
import { HeaderNavigation, HeaderMenuItem } from "@carbon/react";

export function Nav({ isAdmin, currentPath }) {
  return (
    <HeaderNavigation aria-label="Main Navigation">
      <HeaderMenuItem
        href="/"
        aria-current={currentPath === "/" ? "page" : undefined}
      >
        Items
      </HeaderMenuItem>
      <HeaderMenuItem
        href="/categories"
        aria-current={currentPath === "/categories" ? "page" : undefined}
      >
        Categories
      </HeaderMenuItem>
      {isAdmin && (
        <HeaderMenuItem
          href="/admin"
          aria-current={currentPath === "/admin" ? "page" : undefined}
        >
          Admin
        </HeaderMenuItem>
      )}
    </HeaderNavigation>
  );
}
