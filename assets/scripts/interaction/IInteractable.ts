import { Interactor } from "./Interactor";

export interface IInteractable {
    onInteract(interactor: Interactor): void;
}
