// What the Compass should lock onto: the card under the cursor (or, on a
// phone, the card in the middle of the rail), in viewport pixels. The deck
// writes it and the Compass reads it every frame.
export const focus = { x: 0, y: 0, active: false };
