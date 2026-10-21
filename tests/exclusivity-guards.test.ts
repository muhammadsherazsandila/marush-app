import { describe, expect, it } from "vitest";
import {
  validateAuditorAssignment,
  validateControllerProgramCreation,
} from "../src/services/programGuards";
import { Program, ProgramStatus } from "../src/types";

const makeProgram = (
  id: string,
  controllerId: string,
  auditorId: string | undefined,
  status: ProgramStatus,
  programName: string,
): Program => ({
  id,
  programName,
  hatcheryOrFarmName: "Farm " + id,
  flockSize: 5000,
  scheduledStartDate: "2026-11-01",
  scheduledStartTime: "08:00",
  scheduledEndDate: "2026-11-01",
  scheduledEndTime: "12:00",
  controllerId,
  auditorId,
  status,
  teamMemberIds: [],
  createdAt: "2026-11-01T00:00:00Z",
});

describe("Controller & Auditor Exclusivity Guards", () => {
  describe("validateControllerProgramCreation (Controller Exclusivity)", () => {
    it("allows a controller with no existing programs to initiate a program", () => {
      const result = validateControllerProgramCreation("ctrl-1", []);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });

    it("allows a controller whose previous programs are completed or cancelled", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-1", "completed", "Old Completed Program"),
        makeProgram("p-2", "ctrl-1", "aud-2", "cancelled", "Cancelled Program"),
      ];

      const result = validateControllerProgramCreation("ctrl-1", existing);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });

    it("blocks a controller who has an active program in field", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-1", "active", "Ongoing Broiler ND"),
      ];

      const result = validateControllerProgramCreation("ctrl-1", existing);
      expect(result.allowed).toBe(false);
      expect(result.conflictingProgram?.id).toBe("p-1");
      expect(result.reason).toContain("Ongoing Broiler ND");
      expect(result.reason).toContain("active");
    });

    it("blocks a controller who has a program awaiting admin approval", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", undefined, "pending_approval", "Awaiting Admin Program"),
      ];

      const result = validateControllerProgramCreation("ctrl-1", existing);
      expect(result.allowed).toBe(false);
      expect(result.conflictingProgram?.id).toBe("p-1");
      expect(result.reason).toContain("pending_approval");
    });

    it("blocks a controller who has a program awaiting audit or review", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-1", "pending_audit", "Field Work Done Awaiting Audit"),
      ];

      const result = validateControllerProgramCreation("ctrl-1", existing);
      expect(result.allowed).toBe(false);
      expect(result.conflictingProgram?.id).toBe("p-1");
    });

    it("does not block a controller when another controller has an active program", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-other", "aud-1", "active", "Other Controller Active Program"),
      ];

      const result = validateControllerProgramCreation("ctrl-1", existing);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });
  });

  describe("validateAuditorAssignment (Auditor Exclusivity)", () => {
    it("allows assigning an auditor who has no active assignments", () => {
      const result = validateAuditorAssignment("prog-target", "aud-1", []);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });

    it("allows assigning an auditor whose previous programs are completed", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-1", "completed", "Finished Program"),
        makeProgram("p-2", "ctrl-2", "aud-1", "cancelled", "Cancelled Program"),
      ];

      const result = validateAuditorAssignment("prog-target", "aud-1", existing);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });

    it("blocks assigning an auditor who is already assigned to an active program", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-1", "active", "Active Field Audit"),
      ];

      const result = validateAuditorAssignment("prog-target", "aud-1", existing);
      expect(result.allowed).toBe(false);
      expect(result.conflictingProgram?.id).toBe("p-1");
      expect(result.reason).toContain("Active Field Audit");
      expect(result.reason).toContain("active");
    });

    it("blocks assigning an auditor who is assigned to a program pending audit", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-1", "pending_audit", "Pending Audit Program"),
      ];

      const result = validateAuditorAssignment("prog-target", "aud-1", existing);
      expect(result.allowed).toBe(false);
      expect(result.conflictingProgram?.id).toBe("p-1");
    });

    it("allows re-saving the same auditor on the same program", () => {
      const existing: Program[] = [
        makeProgram("prog-same", "ctrl-1", "aud-1", "active", "Current Program"),
      ];

      const result = validateAuditorAssignment("prog-same", "aud-1", existing);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });

    it("does not block assigning an auditor when a different auditor is busy", () => {
      const existing: Program[] = [
        makeProgram("p-1", "ctrl-1", "aud-other", "active", "Other Auditor Active Program"),
      ];

      const result = validateAuditorAssignment("prog-target", "aud-1", existing);
      expect(result.allowed).toBe(true);
      expect(result.conflictingProgram).toBeUndefined();
    });
  });
});
