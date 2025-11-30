# Claude Code Configs CRUD

## Shared Functionality

### New Vue Component - Inline Edit Field

I would like build a Vue component that provides an edit ability to certain config properties. I want to use an edit icon/button to convert single fields to be editable.  a small icon next to it, when clicked, the value will change to an appropriate type field. Floating at the bottom right of the newly displayed field will be a button to accept the field's value, and a button to cancel the edit.

### Delete Experience

The experience for deleting a project's config will be the same. There should be a delete button on the individual config cards, when viewing a project page. There should also be a delete button in the sidebar, towards the right of the Close button. In both instances, it should be an icon button.

When a delete button is clicked, a confirmation modal should show, with a message asking the user if they want to proceed. Below the message, I would like to list any other configs where the particular config is being named. At the bottom of the modal body, there should be a text intput field that requires the user to enter the word "delete", to confirm the deletion. Above the input should be a message stating "Type *delete* below, to confirm.". The footer of the modal should have a 'Delete' and 'Cancel' button. The 'Delete' button should be disabled until the user enters the word 'delete' in the input. 

When the user confirms deletion, the particular config should be deleted.

## Config Types

### Subagents

**Create:**

There will be no feature to create a new Subagent
 
**Edit:**

Subagents will be editable. When viewing a Subagent's config in the sidebar, each property/value will have an Inline Edit Field.

This table defines the type of field for each value:

+--------------------------+
| Description | Field Type |
+--------------------------+
| Name | Text |
| Description | Textarea |
| Color | Color Dropdown |
| Model | Dropdown |
| Allowed Tools | Multiselect |
| Content | Textarea |
+--------------------+

If the Name is changed, the file will also need to be renamed, and we should make sure the Subagent isn't called by name in any other Subagent, Slash Command, or Skill files.

**Delete:**

Subagents can be deleted. 

### Slash Commands

**Create:**

There will be no feature to create a new Slash Command
 
**Edit:** 

Slash Commands will be editable. When viewing a Slash Commands's config in the sidebar, each property/value will have an Inline Edit Field.

This table defines the type of field for each value:

+--------------------------+
| Description | Field Type |
+--------------------------+
| Name | Text |
| Description | Textarea |
| Allowed Tools | Multiselect |
| Content | Textarea |
+--------------------+

If the Name is changed, the file will also need to be renamed, and we should make sure the Subagent isn't called by name in any other Subagent, Slash Command, or Skill files.

**Delete:** 

Slash Commands can be deleted.

### MCP Servers

**Create:**

Modal with a form that will help users install new MCP servers. MCP Servers can be configured several ways, the user will need to know which values go in which inputs. We'll need to investigate the MCP Server config structure to determine what fields are needed.
 
**Edit:** 

MCP Servers will be editable. When viewing an MCP Server's config in the sidebar, each property/value will have an Inline Edit Field.

This table defines the type of field for each value:

+--------------------------+
| Description | Field Type |
+--------------------------+
| Name | Text |
| Transport | Dropdown |
| Command | Text |
| Arguments | Text |
+--------------------+
*Any additional properties discovered should also be included*

If the Name is changed, the file will also need to be renamed, and we should make sure the Subagent isn't called by name in any other Subagent, Slash Command, or Skill files.

**Delete:** 

MCP Servers can be deleted, the config object should be removed from the `mcpServers` opbject.

### Hooks

**Create:**

Modal with a form that will help users install new Hooks. Hooks can be configured several ways, the user will need to know which values go in which inputs. We'll need to investigate the Hook config structure to determine what fields are needed.
 
**Edit:** 

Hooks will be editable. When viewing a Hook's config in the sidebar, each property/value will have an Inline Edit Field. Except for the "Event" value, this will not be editable.

This table defines the type of field for each value:

+--------------------------+
| Description | Field Type |
+--------------------------+
| Type | Dropdown or text? |
| Matcher | Multiselect |
| Command | Text |
+--------------------+
*Any additional properties discovered should also be included*

**Delete:** 

Hooks can be deleted, the appropriate settings file should be updated accordingly.

### Skills

**Create:**

There will be no feature to create a new Skill
 
**Edit:** 

Skills will be editable. When viewing a Skills's config in the sidebar, each property/value will have an Inline Edit Field.

This table defines the type of field for each value:

+--------------------------+
| Description | Field Type |
+--------------------------+
| Name | Text |
| Description | Textarea |
| Allowed Tools | Multiselect |
| Content | Textarea |
+--------------------+

If the Name is changed, the file will also need to be renamed, and we should make sure the Subagent isn't called by name in any other Subagent, Slash Command, or Skill files.

**Delete:** 

Skill can be deleted. Teh skill directory should be removed. Any scripts or files locaed outside the particular skill's directory should remain untouched.

## Referrences and Resources

- Multiselect: https://primevue.org/llms/components/multiselect.md#chips
- Dropdown: 
  - https://primevue.org/llms/components/select.md#checkmark
  - https://primevue.org/llms/components/select.md#clearicon
- Color Dropdown: https://primevue.org/llms/components/select.md#template
