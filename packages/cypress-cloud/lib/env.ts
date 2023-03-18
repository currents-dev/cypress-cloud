import { getAPIBaseUrl } from "./httpClient/config";

export const isCurrents = () => getAPIBaseUrl() === "https://cy.currents.dev";
