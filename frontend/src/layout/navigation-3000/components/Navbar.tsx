import { IconGear, IconSearch, IconToolbar, IconWarning } from '@posthog/icons'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { commandBarLogic } from 'lib/components/CommandBar/commandBarLogic'
import { DebugNotice } from 'lib/components/DebugNotice'
import { Resizer } from 'lib/components/Resizer/Resizer'
import { ScrollableShadows } from 'lib/components/ScrollableShadows/ScrollableShadows'
import { Popover } from 'lib/lemon-ui/Popover'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { useRef } from 'react'
import { Scene } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { navigationLogic } from '~/layout/navigation/navigationLogic'
import { AccountPopoverOverlay } from '~/layout/navigation/TopBar/AccountPopover'
import { themeLogic } from '~/layout/navigation-3000/themeLogic'
import { SidePanelTab } from '~/types'

import { navigation3000Logic } from '../navigationLogic'
import { SidePanelActivationIcon } from '../sidepanel/panels/activation/SidePanelActivation'
import { sidePanelLogic } from '../sidepanel/sidePanelLogic'
import { sidePanelStateLogic } from '../sidepanel/sidePanelStateLogic'
import { KeyboardShortcut } from './KeyboardShortcut'
import { NavbarButton } from './NavbarButton'

export function Navbar(): JSX.Element {
    const { theme } = useValues(themeLogic)
    const { user } = useValues(userLogic)
    const { isAccountPopoverOpen, systemStatusHealthy } = useValues(navigationLogic)
    const { closeAccountPopover, toggleAccountPopover } = useActions(navigationLogic)
    const { isNavShown, isSidebarShown, activeNavbarItemId, navbarItems, mobileLayout } = useValues(navigation3000Logic)
    const { toggleNavCollapsed, hideNavOnMobile, showSidebar, hideSidebar } = useActions(navigation3000Logic)
    const { featureFlags } = useValues(featureFlagLogic)
    const { toggleSearchBar } = useActions(commandBarLogic)
    const { openSidePanel } = useActions(sidePanelStateLogic)
    const { visibleTabs } = useValues(sidePanelLogic)

    const containerRef = useRef<HTMLDivElement | null>(null)

    return (
        <>
            <nav className={clsx('Navbar3000', !isNavShown && 'Navbar3000--hidden')} ref={containerRef}>
                <div
                    className="Navbar3000__content"
                    // eslint-disable-next-line react/forbid-dom-props
                    style={theme?.sidebarStyle}
                >
                    <ScrollableShadows innerClassName="Navbar3000__top" direction="vertical">
                        {navbarItems.map((section, index) => (
                            <ul key={index}>
                                {section.map((item) =>
                                    item.featureFlag && !featureFlags[item.featureFlag] ? null : (
                                        <NavbarButton
                                            key={item.identifier}
                                            title={item.label}
                                            identifier={item.identifier}
                                            icon={item.icon}
                                            sideAction={item.sideAction}
                                            tag={item.tag}
                                            to={'to' in item ? item.to : undefined}
                                            onClick={
                                                'logic' in item
                                                    ? () => {
                                                          if (
                                                              activeNavbarItemId === item.identifier &&
                                                              !isSidebarShown
                                                          ) {
                                                              hideSidebar()
                                                          } else {
                                                              showSidebar(item.identifier)
                                                          }
                                                      }
                                                    : undefined
                                            }
                                            active={activeNavbarItemId === item.identifier && isSidebarShown}
                                        />
                                    )
                                )}
                            </ul>
                        ))}
                    </ScrollableShadows>
                    <div className="Navbar3000__bottom">
                        <ul>
                            <DebugNotice />
                            {visibleTabs.includes(SidePanelTab.Activation) && (
                                <NavbarButton
                                    identifier="activation-button"
                                    icon={<SidePanelActivationIcon />}
                                    title="Quick start"
                                    onClick={() => openSidePanel(SidePanelTab.Activation)}
                                />
                            )}
                            <NavbarButton
                                identifier="search-button"
                                icon={<IconSearch />}
                                shortTitle="Search"
                                title={
                                    <div className="flex flex-col gap-0.5">
                                        <span>
                                            For search, press <KeyboardShortcut command k />
                                        </span>
                                        <span>
                                            For commands, press <KeyboardShortcut command shift k />
                                        </span>
                                    </div>
                                }
                                forceTooltipOnHover
                                sideIcon={<KeyboardShortcut command k />}
                                onClick={toggleSearchBar}
                            />
                            <NavbarButton
                                icon={<IconToolbar />}
                                identifier={Scene.ToolbarLaunch}
                                title="Toolbar"
                                to={urls.toolbarLaunch()}
                            />
                            <NavbarButton
                                icon={<IconGear />}
                                identifier={Scene.Settings}
                                title="Settings"
                                to={urls.settings('project')}
                            />

                            {!systemStatusHealthy ? (
                                <NavbarButton
                                    icon={<IconWarning />}
                                    identifier={Scene.SystemStatus}
                                    title="System issue!"
                                    to={urls.instanceStatus()}
                                />
                            ) : null}

                            <Popover
                                overlay={<AccountPopoverOverlay />}
                                visible={isAccountPopoverOpen}
                                onClickOutside={closeAccountPopover}
                                placement="right-end"
                                className="min-w-70"
                            >
                                <NavbarButton
                                    icon={<ProfilePicture user={user} size="md" />}
                                    identifier="me"
                                    title={`Hi${user?.first_name ? `, ${user?.first_name}` : ''}!`}
                                    shortTitle={user?.first_name || user?.email}
                                    onClick={toggleAccountPopover}
                                />
                            </Popover>
                        </ul>
                    </div>
                </div>
                {!mobileLayout && (
                    <Resizer
                        logicKey="navbar"
                        placement="right"
                        containerRef={containerRef}
                        closeThreshold={100}
                        onToggleClosed={(shouldBeClosed) => toggleNavCollapsed(shouldBeClosed)}
                        onDoubleClick={() => toggleNavCollapsed()}
                    />
                )}
            </nav>
            {mobileLayout && (
                <div
                    className={clsx('Navbar3000__overlay', !isNavShown && 'Navbar3000--hidden')}
                    onClick={() => hideNavOnMobile()}
                />
            )}
        </>
    )
}
