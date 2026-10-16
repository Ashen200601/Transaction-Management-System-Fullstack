export interface Unit {
  id: string;
  /** Short code, e.g. KG. */
  unitCode: string;
  /** e.g. Kilogram. */
  unitName: string;
}

/** "Kilogram (kg)", or just "Box" when the code is the name. */
export function unitLabel(unit: Unit) {
  return unit.unitName.toUpperCase() === unit.unitCode
    ? unit.unitName
    : `${unit.unitName} (${unit.unitCode.toLowerCase()})`;
}
