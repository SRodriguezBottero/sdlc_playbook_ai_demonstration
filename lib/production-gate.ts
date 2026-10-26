export type GateResult = {
  exitCode: 0 | 2;
  message: string;
};

/**
 * The release gate from the playbook: exit 2 blocks the action.
 * The agent can prepare the release. It cannot authorize production.
 */
export function productionGate(
  command: string,
  releaseApproval?: string,
): GateResult {
  const deploysProduction =
    command.includes("deploy") && command.includes("production");

  if (deploysProduction && !releaseApproval) {
    return {
      exitCode: 2,
      message:
        "Producción necesita una autorización de release. El hook sale con código 2 y el deploy no ocurre.",
    };
  }

  if (deploysProduction) {
    return {
      exitCode: 0,
      message: `Autorización ${releaseApproval} aceptada. El hook deja pasar el comando. Branch protection sigue pidiendo a un code owner: el agente no puede aprobarse.`,
    };
  }

  return {
    exitCode: 0,
    message: "Este comando no es un deploy a producción. El hook no interviene.",
  };
}
