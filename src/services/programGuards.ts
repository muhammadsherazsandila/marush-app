import { Program } from "../types";

export interface GuardValidationResult {
  allowed: boolean;
  conflictingProgram?: Program;
  reason?: string;
}

/**
 * Validates that a controller does not have any active/incomplete programs
 * before initiating a new program.
 * Incomplete programs are those whose status is NOT 'completed' and NOT 'cancelled'.
 */
export function validateControllerProgramCreation(
  controllerId: string,
  existingPrograms: Program[],
): GuardValidationResult {
  const conflicting = existingPrograms.find(
    (p) =>
      p.controllerId === controllerId &&
      p.status !== "completed" &&
      p.status !== "cancelled",
  );

  if (conflicting) {
    return {
      allowed: false,
      conflictingProgram: conflicting,
      reason: `A controller cannot initiate a new program while having an incomplete program ("${conflicting.programName}", status: ${conflicting.status}). Complete the current program first.`,
    };
  }

  return { allowed: true };
}

/**
 * Validates that an auditor is not assigned to multiple programs simultaneously.
 * An auditor cannot be assigned to another program if they are currently
 * part of an active/incomplete program.
 */
export function validateAuditorAssignment(
  programId: string,
  auditorId: string,
  existingPrograms: Program[],
): GuardValidationResult {
  const conflicting = existingPrograms.find(
    (p) =>
      p.id !== programId &&
      p.auditorId === auditorId &&
      p.status !== "completed" &&
      p.status !== "cancelled",
  );

  if (conflicting) {
    return {
      allowed: false,
      conflictingProgram: conflicting,
      reason: `This auditor is already assigned to another ongoing program ("${conflicting.programName}", status: ${conflicting.status}). An auditor cannot be part of multiple programs at the same time.`,
    };
  }

  return { allowed: true };
}
