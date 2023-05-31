import {
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  ApplicationRef,
} from '@angular/core';
import {BasePortalHost, ComponentPortal} from './portal';


/**
 * A PortalHost for attaching portals to an arbitrary DOM element outside of the Angular
 * application context.
 *
 * This is the only part of the portal core that directly touches the DOM.
 */
export class DomPortalHost extends BasePortalHost {
  constructor(
      private _hostDomElement: Element,
      private _componentFactoryResolver: ComponentFactoryResolver,
      private _appRef: ApplicationRef) {
    super();
  }

  /**
   * Attach the given ComponentPortal to DOM element using the ComponentFactoryResolver.
   * @param portal Portal to be attached
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>, newestOnTop: boolean): ComponentRef<T> {
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(portal.component);
    let componentRef: ComponentRef<T>;

    // If the portal specifies a ViewContainerRef, we will use that as the attachment point
    // for the component (in terms of Angular's component tree, not rendering).
    // When the ViewContainerRef is missing, we use the factory to create the component directly
    // and then manually attach the ChangeDetector for that component to the application (which
    // happens automatically when using a ViewContainer).
    componentRef = componentFactory.create(portal.injector);

    // When creating a component outside of a ViewContainer, we need to manually register
    // its ChangeDetector with the application. This API is unfortunately not yet published
    // in Angular core. The change detector must also be deregistered when the component
    // is destroyed to prevent memory leaks.
    //

    // ApplicationRef's attachView and detachView methods are in Angular ^2.2.1 but not before.
    // The `else` clause here can be removed once 2.2.1 is released.
    if ((this._appRef as any)['attachView']) {
      (this._appRef as any).attachView(componentRef.hostView);

      this.setDisposeFn(() => {
        (this._appRef as any).detachView(componentRef.hostView);
        componentRef.destroy();
      });
    } else {
      // When creating a component outside of a ViewContainer, we need to manually register
      // its ChangeDetector with the application. This API is unfortunately not published
      // in Angular <= 2.2.0. The change detector must also be deregistered when the component
      // is destroyed to prevent memory leaks.
      const changeDetectorRef = componentRef.changeDetectorRef;
      (this._appRef as any).registerChangeDetector(changeDetectorRef);

      this.setDisposeFn(() => {
        (this._appRef as any).unregisterChangeDetector(changeDetectorRef);

        // Normally the ViewContainer will remove the component's nodes from the DOM.
        // Without a ViewContainer, we need to manually remove the nodes.
        const componentRootNode = this._getComponentRootNode(componentRef);
        if (componentRootNode.parentNode) {
          componentRootNode.parentNode.removeChild(componentRootNode);
        }
      });
    }

    // At this point the component has been instantiated, so we move it to the location in the DOM
    // where we want it to be rendered.
    if (newestOnTop) {
      this._hostDomElement.insertBefore(this._getComponentRootNode(componentRef), this._hostDomElement.firstChild);
    } else {
      this._hostDomElement.appendChild(this._getComponentRootNode(componentRef));
    }

    return componentRef;
  }

  /** Gets the root HTMLElement for an instantiated component. */
  private _getComponentRootNode(componentRef: ComponentRef<any>): HTMLElement {
    return (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
  }
}
