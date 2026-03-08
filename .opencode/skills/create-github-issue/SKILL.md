---
name: create-github-issue
description: Create a GitHub issue for the travel-map project with correct structure, labels, project assignment, and optional sub-issue linking
license: MIT
compatibility: opencode
metadata:
    repo: TheRealKoller/travel-map
    project: 'https://github.com/users/TheRealKoller/projects/3'
---

## What I do

Guide the full workflow for creating a well-structured GitHub issue in the `TheRealKoller/travel-map` repository, including optional sub-issue linking to a parent issue.

## Project context

- **Repository:** `TheRealKoller/travel-map`
- **GitHub Project:** https://github.com/users/TheRealKoller/projects/3 (add every issue to this project)
- **Available labels:** `enhancement`, `bug`, `EPIC`, `refactoring`, `cleanup`, `frontend`, `testing`, `documentation`, `good first issue`, `help wanted`, `dependencies`

## When to use me

Use this skill whenever the user asks to create a GitHub issue, sub-issue, or ticket — e.g. "erstelle ein Issue für...", "leg ein Issue an...", "erstelle ein Sub-Issue unter #X", "create an issue for...".

## Workflow

### 1. Gather information

Ask the user (if not already provided):

- **Title** — short and descriptive
- **Type** — Feature (`enhancement`), Bug (`bug`), Epic (`EPIC`), Refactoring (`refactoring`), etc.
- **Parent issue** — optional, e.g. `#250` to create a sub-issue under an existing epic
- Any additional labels, milestone, or assignee

### 2. Create the issue

Use `gh issue create` with this standard body structure:

```
gh issue create \
  --repo TheRealKoller/travel-map \
  --title "<title>" \
  --label "<label>" \
  --body "$(cat <<'EOF'
## Beschreibung

<1-3 sentences describing the problem or feature>

## Akzeptanzkriterien

- [ ] <criterion 1>
- [ ] <criterion 2>

## Technische Umsetzung

- <implementation note 1>
- <implementation note 2>
EOF
)"
```

### 3. Add to GitHub Project

After creating the issue, add it to the project board:

```
gh issue edit <number> \
  --repo TheRealKoller/travel-map \
  --add-project "TheRealKoller's Project"
```

If that fails, use the GraphQL API to add it to project #3.

### 4. Link as sub-issue (if parent provided)

If a parent issue number was given, use the GraphQL `addSubIssue` mutation.

First, fetch the Node IDs of both issues:

```
# Get Node ID of parent issue
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) { id }
    }
  }
' -f owner=TheRealKoller -f repo=travel-map -F number=<parent_number>

# Get Node ID of new sub-issue
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) { id }
    }
  }
' -f owner=TheRealKoller -f repo=travel-map -F number=<new_issue_number>
```

Then run the mutation:

```
gh api graphql -f query='
  mutation($issueId: ID!, $subIssueId: ID!) {
    addSubIssue(input: { issueId: $issueId, subIssueId: $subIssueId }) {
      issue { number title }
      subIssue { number title }
    }
  }
' -f issueId=<parent_node_id> -f subIssueId=<sub_node_id>
```

### 5. Return the result

Always return the issue URL at the end so the user can open it directly.
