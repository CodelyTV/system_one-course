# 🧠 How to create a plan

1. Ask the user for the task to create a plan for if not specified.

2. Define task phases.

   Let the user choose between different alternatives for the amount of phases suggesting the tasks that will be implemented in each phase:
    - Minimum (1).
    - Intermediate (1-3).
    - Very granular (+3).

3. Specify public contracts to be created/modified/deleted on each phase task.

   It is important to ask for the public contracts to be considered. If the user does not provide them, make suggestions based on the task description.

   Types of public contracts to be considered:
    - Application services and the methods signatures of each one of them.
    - Domain events and the attributes of each one of them.
    - Test suites and all the test cases inside each one of them.
    - Database schemas and the tables inside each one of them.
    - Text copies shown to end users in the UI or emails.

   If there is a public contract type without any change, avoid mentioning that contract type in the plan.

4. Propose the plan to the user for approval. IMPORTANT: Do not start creating the plan until the user has agreed on the specific contracts to be considered and the implementation phases.

## ☝️ General considerations

### 🧠 Logical reasoning

- Use AGENTS.md file as a reference while:
    - Proposing application services, domain events, tests, etc.
    - Following code conventions and architecture decisions (all inside the docs/ directory).
    - Determining the test suites and tests cases to be created/modified/deleted.
- Use available agent tools while offering different alternatives for the user to choose from:
    - `AskQuestion` tool if you are Cursor and have this tool available (only available in certain models such as Opus 4.5, not in others such as Composer 1).
    - `AskUserQuestion` tool if you are Claude Code.

## 🗂️ Plan sections

The plan should contain the following sections:

- Goal
- Context
- Phases (IMPORTANT: each phase should be a vertical slice of the task)
    - Description (brief description of the phase)
    - To-do actions list (checkboxes list of actions to complete the phase)
- Next step

## 💡 Considerations for each plan section

### 🎯 Goal section

- Write it short and concise. It should be 1-3 sentences that summarize the goal of the task.

### 👀 Context section

- List the important files, folders, and code to consider.
- Link the files and folders to the actual code in the repository to make it easier for the user to review the context.
- Read the AGENTS.md file and the relevant documentation referenced in that file to understand the architecture and the coding conventions to follow while proposing the plan. Mention the specific documentation files to be considered.

### 🪜 Phases section

- Use vertical slices of the task to create the phases.
    - Vertical slices: Agile software development approach that implements a functional feature from end-to-end. Span UI, backend logic, and database changes in a single phase rather than building technical layers separately.
    - Incorrect: Create the endpoint controller in Phase 1 and the service class it invokes in Phase 2.
    - Incorrect: Add the Server Action in Phase 1 and the endpoint controller it invokes in Phase 2.
    - Correct: If you have to implement a form for editing some user data, create the happy path layers (form component and its tests, backend logic and its tests, database schema) in Phase 1 (only for the happy path). Use following phases to add the validation rules for corner cases and their corresponding tests.
    - Correct: If we want to implement a new feature for suggesting courses to users based on the courses they have marked as favorite, phase 1 should implement the "mark as favorite" feature (including its tests), and phase 2 should implement the "suggest courses" feature (including its tests).
- Each phase must contain its description and the to-do actions list.
- Split the task into as many phases as needed to make them easier to review and merge. Do not mix multiple responsibilities in the same phase. For instance, avoid adding the required npm dependencies in the same phase as the first use case implementation.
- We must be able to commit and push the code for each phase without breaking the build. The tests must pass and the added code makes sense as its own isolated unit.
- Prioritize early feedback loops. Phase 1 should always produce something the user can see, interact with, or run. For example, when creating a new frontend page, Phase 1 should deliver a navigable page (even with incomplete or placeholder content) rather than preparing all the data/content first. This lets the user validate direction early and course-correct before investing in polish.
    1. "Run `npm run prep` to verify the changes in terms of typechecking and linting. Fix issues if any."
    2. "STOP. Present the changes to the user for review and suggest commit messages. Do NOT proceed to the next phase until the user explicitly asks."
