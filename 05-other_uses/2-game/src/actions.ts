export const gameActionIds = [
	"walk_right",
	"jump_right",
	"long_jump_right",
	"jump_up",
] as const;

export type GameActionId = (typeof gameActionIds)[number];

export const gameActionCriteria: Record<GameActionId, string> = {
	walk_right:
		"Walk forward. Correct when there is no </> reward block directly above and the path is clear, or the nearest obstacle is still far: a bug 3 or more tiles ahead, or a gap, a wall or spikes 2 or more tiles ahead.",
	jump_right:
		"Jump forward. Correct when a bug is 2 tiles ahead or closer, or when a small obstacle is 1 tile ahead or closer: a gap or spikes 1 or 2 tiles wide, or a wall 1 or 2 tiles high. Never jump at an obstacle that is farther: walk to it first.",
	long_jump_right:
		"Take a long running jump forward. Correct when a big obstacle is 1 tile ahead or closer: a gap or spikes 3 or more tiles wide, or a wall 3 or more tiles high. Never jump at an obstacle that is farther: walk to it first.",
	jump_up:
		"Jump in place to hit the </> reward block that is directly above Turbotuga. Correct only when a reward block is directly above and no obstacle is 1 tile ahead or closer.",
};
