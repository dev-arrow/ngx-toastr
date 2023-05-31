import {ComponentResolver, Injectable} from '@angular/core';
import {DomPortalHost} from '../portal/dom-portal-host';
import {OverlayRef} from './overlay-ref';

import {OverlayContainer} from './overlay-container';

/** Next overlay unique ID. */
let nextUniqueId = 0;


/**
 * Service to create Overlays. Overlays are dynamically added pieces of floating UI, meant to be
 * used as a low-level building building block for other components. Dialogs, tooltips, menus,
 * selects, etc. can all be built using overlays. The service should primarily be used by authors
 * of re-usable components rather than developers building end-user applications.
 *
 * An overlay *is* a PortalHost, so any kind of Portal can be loaded into one.
 */
 @Injectable()
export class Overlay {
  constructor(private _overlayContainer: OverlayContainer,
              private _componentResolver: ComponentResolver) {}

  /**
   * Creates an overlay.
   * @param state State to apply to the overlay.
   * @returns A reference to the created overlay.
   */
  create(): Promise<OverlayRef> {
    return this._createPaneElement().then(pane => this._createOverlayRef(pane));
  }

  /**
   * Returns a position builder that can be used, via fluent API,
   * to construct and configure a position strategy.
   */
  position() {
  }

  /**
   * Creates the DOM element for an overlay and appends it to the overlay container.
   * @returns Promise resolving to the created element.
   */
  private _createPaneElement(): Promise<HTMLElement> {
    // not being used for toastr
    // let pane = document.createElement('div');
    // pane.id = `md-overlay-${nextUniqueId++}`;
    // pane.classList.add('md-overlay-pane');
    //
    // this._overlayContainer.getContainerElement().appendChild(pane);

    return Promise.resolve(this._overlayContainer.getContainerElement());
  }

  /**
   * Create a DomPortalHost into which the overlay content can be loaded.
   * @param pane The DOM element to turn into a portal host.
   * @returns A portal host for the given DOM element.
   */
  private _createPortalHost(pane: HTMLElement): DomPortalHost {
    return new DomPortalHost(pane, this._componentResolver);
  }

  /**
   * Creates an OverlayRef for an overlay in the given DOM element.
   * @param pane DOM element for the overlay
   * @param state
   * @returns {OverlayRef}
   */
  private _createOverlayRef(pane: HTMLElement): OverlayRef {
    return new OverlayRef(this._createPortalHost(pane), pane);
  }
}


/** Providers for Overlay and its related injectables. */
export const OVERLAY_PROVIDERS = [
  Overlay,
];
