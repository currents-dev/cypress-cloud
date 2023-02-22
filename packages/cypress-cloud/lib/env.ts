import { getBaseUrl } from "./httpClient/config";

export const isCurrents = () => getBaseUrl() === "https://cy.currents.dev";
