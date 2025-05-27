import React from "react";
import {
  HeaderContainer,
  Header,
  SkipToContent,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from "@carbon/react";
import { User as UserAvatar } from "@carbon/icons-react";

const AppHeader = () => (
  <HeaderContainer
    render={({}) => (
      <Header aria-label="Stock Control">
        <SkipToContent />

        <HeaderName href="#" prefix="">
          StockControl
        </HeaderName>

        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label="User profile">
            <UserAvatar />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
    )}
  />
);

export default AppHeader;
