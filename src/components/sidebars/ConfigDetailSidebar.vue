<template>
  <Drawer
    v-model:visible="localVisible"
    position="right"
    :modal="true"
    :dismissable="true"
    :close-on-escape="true"
    :block-scroll="true"
    :show-close-icon="false"
    class="config-detail-drawer"
  >
    <!-- Custom Header with Navigation -->
    <template #header>
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <i :class="typeIcon" :style="{ color: typeColor }"></i>
        <span class="text-lg font-semibold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
          {{ selectedItem?.name || selectedItem?.event || 'Item Details' }}
        </span>
      </div>
      <div class="flex gap-2">
        <Button
          @click="handleNavigatePrev"
          :disabled="!hasPrev"
          icon="pi pi-chevron-left"
          text
          class="nav-btn"
          aria-label="Previous item"
        />
        <Button
          @click="handleNavigateNext"
          :disabled="!hasNext"
          icon="pi pi-chevron-right"
          text
          class="nav-btn"
          aria-label="Next item"
        />
        <Button
          @click="localVisible = false"
          icon="pi pi-times"
          text
          class="nav-btn"
          aria-label="Close sidebar"
        />
      </div>
    </template>

    <!-- Main Content -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

      <!-- Agents Metadata -->
      <div v-if="selectedType === 'agents'">
        <!-- Name Field -->
        <LabeledEditField
          v-model="agentData.name"
          field-type="text"
          label="Name"
          placeholder="agent-name"
          :disabled="!canEdit || editingField !== null && editingField !== 'name'"
          :validation="[{ type: 'required' }, { type: 'agentName' }]"
          @edit-start="editingField = 'name'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('name', $event)"
        />

        <!-- Description Field -->
        <LabeledEditField
          v-model="agentData.description"
          field-type="textarea"
          label="Description"
          placeholder="Brief description"
          :disabled="!canEdit || editingField !== null && editingField !== 'description'"
          :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Description must be at least 10 characters' }]"
          @edit-start="editingField = 'description'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('description', $event)"
        />

        <!-- Color Field -->
        <LabeledEditField
          v-model="agentData.color"
          field-type="colorpalette"
          label="Color"
          :disabled="!canEdit || editingField !== null && editingField !== 'color'"
          @edit-start="editingField = 'color'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('color', $event)"
        />

        <!-- Model Field -->
        <LabeledEditField
          v-model="agentData.model"
          field-type="selectbutton"
          label="Model"
          :options="modelOptions"
          :disabled="!canEdit || editingField !== null && editingField !== 'model'"
          @edit-start="editingField = 'model'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('model', $event)"
        />

        <!-- Permission Mode Field -->
        <LabeledEditField
          v-model="agentData.permissionMode"
          field-type="select"
          label="Permission Mode"
          :options="permissionOptions"
          :disabled="!canEdit || editingField !== null && editingField !== 'permissionMode'"
          @edit-start="editingField = 'permissionMode'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('permissionMode', $event)"
        />

        <!-- Tools Field -->
        <LabeledEditField
          v-model="agentData.tools"
          field-type="multiselect"
          label="Allowed Tools"
          :options="toolOptions"
          placeholder="Select allowed tools"
          :disabled="!canEdit || editingField !== null && editingField !== 'tools'"
          @edit-start="editingField = 'tools'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('tools', $event)"
        />

        <!-- Skills Field -->
        <LabeledEditField
          v-model="agentData.skills"
          field-type="multiselect"
          label="Skills"
          :options="skillOptions"
          placeholder="Select skills"
          :disabled="!canEdit || editingField !== null && editingField !== 'skills'"
          @edit-start="editingField = 'skills'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('skills', $event)"
        />
      </div>

      <!-- Commands Metadata -->
      <div v-else-if="selectedType === 'commands'">
        <!-- Name Field -->
        <LabeledEditField
          v-model="commandData.name"
          field-type="text"
          label="Name"
          placeholder="command-name"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'name'"
          :validation="[{ type: 'required' }]"
          @edit-start="editingField = 'name'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('name', $event)"
        />

        <!-- Description Field -->
        <LabeledEditField
          v-model="commandData.description"
          field-type="textarea"
          label="Description"
          placeholder="Brief description"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'description'"
          @edit-start="editingField = 'description'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('description', $event)"
        />

        <!-- Model Field -->
        <LabeledEditField
          v-model="commandData.model"
          field-type="selectbutton"
          label="Model"
          :options="commandModelOptions"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'model'"
          @edit-start="editingField = 'model'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('model', $event)"
        />

        <!-- Allowed Tools Field -->
        <LabeledEditField
          v-model="commandData.allowedTools"
          field-type="multiselect"
          label="Allowed Tools"
          :options="toolOptions"
          placeholder="Select allowed tools"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'allowedTools'"
          @edit-start="editingField = 'allowedTools'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('allowedTools', $event)"
        />

        <!-- Argument Hint Field (optional - only show if has value or can edit) -->
        <LabeledEditField
          v-if="canEditCommand || commandData.argumentHint"
          v-model="commandData.argumentHint"
          field-type="text"
          label="Argument Hint"
          placeholder="<query>"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'argumentHint'"
          @edit-start="editingField = 'argumentHint'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('argumentHint', $event)"
        />

        <!-- Model Invocation Field (optional - only show if has value or can edit) -->
        <LabeledEditField
          v-if="canEditCommand || commandData.disableModelInvocation !== null"
          v-model="commandData.disableModelInvocation"
          field-type="selectbutton"
          label="Model Invocation"
          :options="modelInvocationOptions"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'disableModelInvocation'"
          @edit-start="editingField = 'disableModelInvocation'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('disableModelInvocation', $event)"
        />
      </div>

      <!-- Hooks Metadata -->
      <div v-else-if="selectedType === 'hooks'">
        <!-- Event Field (READONLY - cannot change after creation) -->
        <p class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Event:</strong> {{ selectedItem.event }}
          <span class="text-text-muted text-xs ml-2">(read-only)</span>
        </p>

        <!-- Matcher Field (only for PreToolUse/PostToolUse events) -->
        <LabeledEditField
          v-if="isMatcherBasedEvent(selectedItem.event)"
          v-model="hookData.matcher"
          field-type="text"
          label="Matcher"
          placeholder="Bash|Read|Write or *"
          :disabled="!canEditHook || editingField !== null && editingField !== 'matcher'"
          :validation="[{ type: 'required' }]"
          @edit-start="editingField = 'matcher'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('matcher', $event)"
        />

        <!-- Type Field (command or prompt - prompt only for Stop/SubagentStop) -->
        <LabeledEditField
          v-model="hookData.type"
          field-type="selectbutton"
          label="Type"
          :options="supportsPromptType(hookData.event) ? hookTypeOptions : [{ label: 'Command', value: 'command' }]"
          :disabled="!canEditHook || editingField !== null && editingField !== 'type'"
          @edit-start="editingField = 'type'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('type', $event)"
        />

        <!-- Command Field -->
        <LabeledEditField
          v-model="hookData.command"
          field-type="textarea"
          label="Command"
          placeholder="Shell command to execute"
          :disabled="!canEditHook || editingField !== null && editingField !== 'command'"
          :validation="[{ type: 'required' }]"
          @edit-start="editingField = 'command'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('command', $event)"
        />

        <!-- Timeout Field -->
        <LabeledEditField
          v-model="hookData.timeout"
          field-type="number"
          label="Timeout (ms)"
          placeholder="30000"
          :disabled="!canEditHook || editingField !== null && editingField !== 'timeout'"
          @edit-start="editingField = 'timeout'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('timeout', $event)"
        />

        <!-- Enabled Field -->
        <LabeledEditField
          v-model="hookData.enabled"
          field-type="selectbutton"
          label="Enabled"
          :options="booleanOptions"
          :disabled="!canEditHook || editingField !== null && editingField !== 'enabled'"
          @edit-start="editingField = 'enabled'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('enabled', $event)"
        />

        <!-- Suppress Output Field -->
        <LabeledEditField
          v-model="hookData.suppressOutput"
          field-type="selectbutton"
          label="Suppress Output"
          :options="booleanOptions"
          :disabled="!canEditHook || editingField !== null && editingField !== 'suppressOutput'"
          @edit-start="editingField = 'suppressOutput'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('suppressOutput', $event)"
        />

        <!-- Continue Field -->
        <LabeledEditField
          v-model="hookData.continue"
          field-type="selectbutton"
          label="Continue on Error"
          :options="booleanOptions"
          :disabled="!canEditHook || editingField !== null && editingField !== 'continue'"
          @edit-start="editingField = 'continue'"
          @edit-cancel="editingField = null"
          @edit-accept="handleHookFieldUpdate('continue', $event)"
        />
      </div>

      <!-- MCP Servers Metadata -->
      <div v-else-if="selectedType === 'mcp'">
        <!-- Name Field -->
        <LabeledEditField
          v-model="mcpData.name"
          field-type="text"
          label="Name"
          placeholder="server-name"
          :disabled="!canEditMcp || editingField !== null && editingField !== 'name'"
          :validation="[{ type: 'required' }, { type: 'pattern', param: /^[a-zA-Z0-9_-]+$/, message: 'Name can only contain letters, numbers, hyphens, and underscores' }]"
          @edit-start="editingField = 'name'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('name', $event)"
        />

        <!-- Transport Type Field (read-only) -->
        <p class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Transport:</strong>
          {{ mcpData.type }}
          <span class="text-text-tertiary text-xs">(read-only)</span>
        </p>

        <!-- stdio-specific fields -->
        <template v-if="mcpData.type === 'stdio'">
          <!-- Command Field -->
          <LabeledEditField
            v-model="mcpData.command"
            field-type="text"
            label="Command"
            placeholder="node"
            :disabled="!canEditMcp || editingField !== null && editingField !== 'command'"
            :validation="[{ type: 'required' }]"
            @edit-start="editingField = 'command'"
            @edit-cancel="editingField = null"
            @edit-accept="handleMcpFieldUpdate('command', $event)"
          />

          <!-- Args Field (array editor) -->
          <div class="my-3">
            <div class="text-text-primary font-bold text-sm mb-2">Arguments</div>
            <ArgsArrayEditor
              v-model="mcpData.args"
              :disabled="!canEditMcp"
              placeholder="Add argument..."
              @update:model-value="handleMcpFieldUpdate('args', $event)"
            />
          </div>

          <!-- Env Field (key-value editor) -->
          <div class="my-3">
            <div class="text-text-primary font-bold text-sm mb-2">Environment Variables</div>
            <KeyValueEditor
              v-model="mcpData.env"
              :disabled="!canEditMcp"
              key-placeholder="VAR_NAME"
              value-placeholder="value"
              @update:model-value="handleMcpFieldUpdate('env', $event)"
            />
          </div>
        </template>

        <!-- http/sse-specific fields -->
        <template v-if="mcpData.type === 'http' || mcpData.type === 'sse'">
          <!-- URL Field -->
          <LabeledEditField
            v-model="mcpData.url"
            field-type="text"
            label="URL"
            placeholder="https://example.com"
            :disabled="!canEditMcp || editingField !== null && editingField !== 'url'"
            :validation="[{ type: 'required' }]"
            @edit-start="editingField = 'url'"
            @edit-cancel="editingField = null"
            @edit-accept="handleMcpFieldUpdate('url', $event)"
          />

          <!-- Headers Field (key-value editor) -->
          <div class="my-3">
            <div class="text-text-primary font-bold text-sm mb-2">Headers</div>
            <KeyValueEditor
              v-model="mcpData.headers"
              :disabled="!canEditMcp"
              key-placeholder="Header-Name"
              value-placeholder="value"
              @update:model-value="handleMcpFieldUpdate('headers', $event)"
            />
          </div>
        </template>

        <!-- Common fields (all transport types) -->
        <!-- Enabled Field -->
        <LabeledEditField
          v-model="mcpData.enabled"
          field-type="selectbutton"
          label="Enabled"
          :options="booleanOptions"
          :disabled="!canEditMcp || editingField !== null && editingField !== 'enabled'"
          @edit-start="editingField = 'enabled'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('enabled', $event)"
        />

        <!-- Timeout Field (optional) -->
        <LabeledEditField
          v-if="canEditMcp || mcpData.timeout !== null"
          v-model="mcpData.timeout"
          field-type="number"
          label="Timeout (ms)"
          placeholder="30000"
          :disabled="!canEditMcp || editingField !== null && editingField !== 'timeout'"
          @edit-start="editingField = 'timeout'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('timeout', $event)"
        />

        <!-- Retries Field (optional) -->
        <LabeledEditField
          v-if="canEditMcp || mcpData.retries !== null"
          v-model="mcpData.retries"
          field-type="number"
          label="Retries"
          placeholder="3"
          :disabled="!canEditMcp || editingField !== null && editingField !== 'retries'"
          @edit-start="editingField = 'retries'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('retries', $event)"
        />
      </div>

      <!-- Skills Metadata -->
      <div v-else-if="selectedType === 'skills'">
        <!-- Skill Name (Read-Only - directory name cannot be changed) -->
        <p class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}
        </p>

        <!-- Skill Description Field -->
        <LabeledEditField
          v-model="skillData.description"
          field-type="textarea"
          label="Description"
          placeholder="Brief description of what this skill does"
          :disabled="!canEditSkill || editingField !== null && editingField !== 'description'"
          :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Description must be at least 10 characters' }]"
          @edit-start="editingField = 'description'"
          @edit-cancel="editingField = null"
          @edit-accept="handleSkillFieldUpdate('description', $event)"
        />

        <!-- Allowed Tools Field -->
        <LabeledEditField
          v-model="skillData.allowedTools"
          field-type="multiselect"
          label="Allowed Tools"
          :options="toolOptions"
          placeholder="Select allowed tools"
          :disabled="!canEditSkill || editingField !== null && editingField !== 'allowedTools'"
          @edit-start="editingField = 'allowedTools'"
          @edit-cancel="editingField = null"
          @edit-accept="handleSkillFieldUpdate('allowedTools', $event)"
        />

        <!-- Supporting Files (Read-Only Display) -->
        <div v-if="selectedItem.fileCount || selectedItem.files" class="my-3">
          <div class="text-text-primary font-bold text-sm mb-2">Supporting Files (Read-Only)</div>
          <Accordion :value="null" class="skill-structure-accordion">
            <AccordionPanel value="files">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-folder text-color-skills"></i>
                  <span class="font-semibold">File Tree</span>
                  <span class="text-text-muted text-xs ml-1">({{ selectedItem.fileCount }} files)</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="file-tree pl-2">
                  <div
                    v-for="(file, index) in selectedItem.files"
                    :key="index"
                    class="file-tree-item"
                    :class="{ 'directory': file.type === 'directory' }"
                    :style="{ paddingLeft: getIndentLevel(file.relativePath) + 'rem' }"
                  >
                    <i :class="file.type === 'directory' ? 'pi pi-folder' : 'pi pi-file'"
                       :style="{ color: file.type === 'directory' ? 'var(--color-skills)' : 'var(--text-muted)' }"></i>
                    <span class="text-xs text-text-secondary">{{ file.name }}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>

        <!-- External References Warning -->
        <div v-if="selectedItem.externalReferences && selectedItem.externalReferences.length > 0" class="my-3 p-3 bg-color-warning-bg rounded border border-color-warning">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-color-warning mt-0.5 text-lg"></i>
            <div class="flex-1">
              <p class="text-sm font-semibold text-color-warning mb-1">External References Detected</p>
              <p class="text-xs text-text-secondary mb-3">
                This skill contains {{ selectedItem.externalReferences.length }}
                reference{{ selectedItem.externalReferences.length > 1 ? 's' : '' }} to files outside the skill directory, which may affect portability when copying to other projects.
              </p>
              <div class="space-y-2">
                <div v-for="(ref, index) in selectedItem.externalReferences" :key="index" class="bg-bg-primary p-2 rounded text-xs">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-text-muted">Line {{ ref.line }}:</span>
                    <Tag
                      :severity="ref.severity === 'error' ? 'danger' : 'warning'"
                      :value="ref.type?.toUpperCase() || 'REFERENCE'"
                      class="text-[10px] px-1.5 py-0.5"
                    />
                  </div>
                  <code class="block bg-bg-secondary px-2 py-1 rounded font-mono text-text-secondary break-all">{{ ref.reference }}</code>
                  <p class="text-text-muted mt-1">in {{ ref.file }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Parse Error -->
        <div v-if="selectedItem.hasError && selectedItem.parseError" class="my-3 p-3 bg-color-error-bg rounded border border-color-error">
          <div class="flex items-start gap-2">
            <i class="pi pi-times-circle text-color-error mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-semibold text-color-error mb-1">Parse Error</p>
              <p class="text-xs text-text-secondary">{{ selectedItem.parseError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div v-if="selectedItem?.content" class="mb-6">
      <!-- For agents and commands, show section header -->
      <h4 v-if="selectedType === 'agents' || selectedType === 'commands'" class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">
        {{ selectedType === 'agents' ? 'System Prompt' : 'Content' }}
      </h4>

      <!-- For agents, use inline editing -->
      <div v-if="selectedType === 'agents'">
        <LabeledEditField
          v-model="agentData.systemPrompt"
          field-type="textarea"
          label="System Prompt"
          placeholder="The agent's system prompt (instructions)"
          :disabled="!canEdit || editingField !== null && editingField !== 'systemPrompt'"
          :validation="[{ type: 'required' }, { type: 'minLength', param: 20, message: 'System prompt must be at least 20 characters' }]"
          @edit-start="editingField = 'systemPrompt'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('systemPrompt', $event)"
        />
      </div>

      <!-- For commands, use inline editing -->
      <div v-else-if="selectedType === 'commands'">
        <LabeledEditField
          v-model="commandData.content"
          field-type="textarea"
          label="Content"
          placeholder="The command's content (instructions)"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'content'"
          :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Content must be at least 10 characters' }]"
          @edit-start="editingField = 'content'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('content', $event)"
        />
      </div>

      <!-- For skills, use inline editing with label on the field (no section header) -->
      <div v-else-if="selectedType === 'skills'">
        <LabeledEditField
          v-model="skillData.content"
          field-type="textarea"
          label="Content"
          placeholder="The skill's markdown content (instructions, examples, etc.)"
          :disabled="!canEditSkill || editingField !== null && editingField !== 'content'"
          :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Content must be at least 10 characters' }]"
          @edit-start="editingField = 'content'"
          @edit-cancel="editingField = null"
          @edit-accept="handleSkillFieldUpdate('content', $event)"
        />
      </div>

      <!-- For other types, show as read-only -->
      <pre v-else class="bg-bg-primary p-4 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[400px] overflow-y-auto text-text-primary">{{ selectedItem.content }}</pre>
    </div>

    <!-- Footer with Actions (inline icon buttons) -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <!-- Delete Button (for agents, commands, skills, and hooks with edit enabled) -->
        <Button
          v-if="(selectedType === 'agents' && canEdit) || (selectedType === 'commands' && canEditCommand) || (selectedType === 'skills' && canEditSkill) || (selectedType === 'hooks' && canEditHook)"
          @click="handleDelete"
          :disabled="!selectedItem"
          icon="pi pi-trash"
          outlined
          severity="danger"
          aria-label="Delete"
          v-tooltip.top="'Delete'"
          class="sidebar-action-btn delete-action-btn"
        />

        <Button
          @click="handleCopy"
          :disabled="!selectedItem"
          icon="pi pi-copy"
          outlined
          aria-label="Copy"
          v-tooltip.top="'Copy'"
          class="sidebar-action-btn copy-action-btn"
        />
        <Button
          @click="localVisible = false"
          icon="pi pi-times"
          outlined
          aria-label="Close"
          v-tooltip.top="'Close'"
          class="sidebar-action-btn close-action-btn"
        />
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import Tag from 'primevue/tag'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import ArgsArrayEditor from '@/components/forms/ArgsArrayEditor.vue'
import KeyValueEditor from '@/components/forms/KeyValueEditor.vue'
import { useAgentsStore } from '@/stores/agents'
import { useCommandsStore } from '@/stores/commands'
import { useSkillsStore } from '@/stores/skills'
import { useHooksStore } from '@/stores/hooks'
import { useMcpStore } from '@/stores/mcp'

const agentsStore = useAgentsStore()
const commandsStore = useCommandsStore()
const skillsStore = useSkillsStore()
const hooksStore = useHooksStore()
const mcpStore = useMcpStore()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false
  },
  selectedItem: {
    type: Object,
    default: null
  },
  selectedType: {
    type: String,
    default: null
  },
  currentItems: {
    type: Array,
    default: () => []
  },
  selectedIndex: {
    type: Number,
    default: -1
  },
  // CRUD support (for agents)
  scope: {
    type: String,
    default: null,
    validator: (value) => value === null || ['project', 'user'].includes(value)
  },
  projectId: {
    type: String,
    default: null
  },
  enableCrud: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits({
  close: null,
  navigate: (direction) => {
    return direction === 'prev' || direction === 'next'
  },
  'copy-clicked': (item) => {
    return item && typeof item === 'object'
  },
  'agent-delete': (item) => {
    return item && typeof item === 'object'
  },
  'agent-updated': () => true,
  'command-delete': (item) => {
    return item && typeof item === 'object'
  },
  'command-updated': () => true,
  'skill-delete': (item) => {
    return item && typeof item === 'object'
  },
  'skill-updated': () => true,
  'hook-delete': (item) => {
    return item && typeof item === 'object'
  },
  'hook-updated': () => true,
  'mcp-delete': (item) => {
    return item && typeof item === 'object'
  },
  'mcp-updated': () => true,
  'update:visible': (value) => typeof value === 'boolean'
})

// Local visibility state that syncs with parent via v-model pattern
const localVisible = ref(props.visible)

// Sync parent -> local
watch(() => props.visible, (newVal) => {
  localVisible.value = newVal
})

// Sync local -> parent (emit close when drawer closes)
watch(localVisible, (newVal) => {
  if (!newVal) {
    emit('close')
  }
  emit('update:visible', newVal)
})

// Agent editing state
const agentData = ref({
  name: '',
  description: '',
  color: '',
  model: 'inherit',
  permissionMode: 'default',
  tools: [],
  skills: [],
  systemPrompt: ''
})

// Command editing state
const commandData = ref({
  name: '',
  description: '',
  model: 'inherit',
  allowedTools: [],
  argumentHint: '',
  disableModelInvocation: false,
  content: ''
})

// Skill editing state
const skillData = ref({
  name: '',
  description: '',
  allowedTools: [],
  content: ''
})

// Hook editing state
const hookData = ref({
  event: '',
  matcher: '',
  type: 'command',
  command: '',
  timeout: 30000,
  enabled: true,
  suppressOutput: false,
  continue: true
})

// MCP editing state
const mcpData = ref({
  name: '',
  type: 'stdio',
  command: '',
  args: [],
  env: {},
  url: '',
  headers: {},
  enabled: true,
  timeout: null,
  retries: null
})

const editingField = ref(null)

// Computed: Can edit agents (only if enableCrud is true and not a plugin agent)
const canEdit = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'agents' &&
         props.selectedItem?.location !== 'plugin'
})

// Computed: Can edit commands (only if enableCrud is true)
const canEditCommand = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'commands'
})

// Computed: Can edit skills (only if enableCrud is true)
const canEditSkill = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'skills'
})

// Computed: Can edit hooks (only if enableCrud is true)
const canEditHook = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'hooks'
})

// Computed: Can edit MCP servers (only if enableCrud is true)
const canEditMcp = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'mcp'
})

// Model options for agents
const modelOptions = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' }
]

// Model options for commands (same as agents)
const commandModelOptions = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' }
]

// Model invocation options for commands
const modelInvocationOptions = [
  { label: 'Allow Model', value: false },
  { label: 'Skip Model', value: true }
]

// Permission mode options for agents
const permissionOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
  { label: 'Ignore', value: 'ignore' }
]

// Tool options for agents
const toolOptions = [
  { label: 'Bash', value: 'Bash' },
  { label: 'Read', value: 'Read' },
  { label: 'Write', value: 'Write' },
  { label: 'Edit', value: 'Edit' },
  { label: 'Glob', value: 'Glob' },
  { label: 'Grep', value: 'Grep' },
  { label: 'WebFetch', value: 'WebFetch' },
  { label: 'TodoRead', value: 'TodoRead' },
  { label: 'TodoWrite', value: 'TodoWrite' }
]

// Skill options for agents (TODO: populate from available skills)
const skillOptions = computed(() => {
  // For now, return empty array
  // TODO: Get actual skills from store/API
  return []
})

// Hook type options
const hookTypeOptions = [
  { label: 'Command', value: 'command' },
  { label: 'Prompt', value: 'prompt' }
]

// Boolean options for hook fields
const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// MCP transport type options
const transportTypeOptions = [
  { label: 'stdio', value: 'stdio' },
  { label: 'http', value: 'http' },
  { label: 'sse', value: 'sse' }
]

// Events that require a matcher field (PreToolUse, PostToolUse)
const MATCHER_BASED_EVENTS = ['PreToolUse', 'PostToolUse']

// Events that support prompt type (Stop, SubagentStop, UserPromptSubmit, PreToolUse, PermissionRequest)
const PROMPT_SUPPORTED_EVENTS = ['Stop', 'SubagentStop', 'UserPromptSubmit', 'PreToolUse', 'PermissionRequest']

// Check if event requires matcher
const isMatcherBasedEvent = (event) => MATCHER_BASED_EVENTS.includes(event)

// Check if event supports prompt type
const supportsPromptType = (event) => PROMPT_SUPPORTED_EVENTS.includes(event)

// Common tool options for matcher field
const matcherToolOptions = [
  { label: 'All Tools (*)', value: '*' },
  { label: 'Bash', value: 'Bash' },
  { label: 'Read', value: 'Read' },
  { label: 'Write', value: 'Write' },
  { label: 'Edit', value: 'Edit' },
  { label: 'Glob', value: 'Glob' },
  { label: 'Grep', value: 'Grep' },
  { label: 'Task', value: 'Task' },
  { label: 'WebFetch', value: 'WebFetch' },
  { label: 'WebSearch', value: 'WebSearch' }
]

// Watch for selectedItem changes to update agentData
watch(() => props.selectedItem, (newItem) => {
  if (newItem && props.selectedType === 'agents') {
    // Trim leading newline from systemPrompt for display (it's just formatting for the file)
    let displaySystemPrompt = newItem.content || ''
    if (displaySystemPrompt.startsWith('\n')) {
      displaySystemPrompt = displaySystemPrompt.substring(1)
    }

    agentData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      color: newItem.color || '',
      model: newItem.model || 'inherit',
      permissionMode: newItem.permissionMode || 'default',
      tools: newItem.tools || [],
      skills: newItem.skills || [],
      systemPrompt: displaySystemPrompt
    }
    editingField.value = null
  } else if (newItem && props.selectedType === 'commands') {
    // Update command data
    commandData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      model: newItem.model || 'inherit',
      allowedTools: newItem.tools || [],
      argumentHint: newItem.argumentHint || '',
      disableModelInvocation: newItem.disableModelInvocation || false,
      content: newItem.content || ''
    }
    editingField.value = null
  } else if (newItem && props.selectedType === 'skills') {
    // Update skill data
    skillData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      allowedTools: newItem.allowedTools || [],
      content: newItem.content || ''
    }
    editingField.value = null
  } else if (newItem && props.selectedType === 'hooks') {
    // Update hook data
    hookData.value = {
      event: newItem.event || '',
      matcher: newItem.matcher || '',
      type: newItem.type || 'command',
      command: newItem.command || '',
      timeout: newItem.timeout || 30000,
      enabled: newItem.enabled !== false, // Default to true
      suppressOutput: newItem.suppressOutput || false,
      continue: newItem.continue !== false // Default to true
    }
    editingField.value = null
  } else if (newItem && props.selectedType === 'mcp') {
    // Update MCP data
    mcpData.value = {
      name: newItem.name || '',
      type: newItem.type || newItem.transport || newItem.transportType || 'stdio',
      command: newItem.command || '',
      args: newItem.args || [],
      env: newItem.env || {},
      url: newItem.url || '',
      headers: newItem.headers || {},
      enabled: newItem.enabled !== false, // Default to true
      timeout: newItem.timeout || null,
      retries: newItem.retries || null
    }
    editingField.value = null
  }
}, { immediate: true })

// Handle field update (called when InlineEditField saves)
const handleFieldUpdate = async (fieldName, newValue) => {
  if (!canEdit.value) return

  try {
    // Build updates object with just the changed field
    // Note: All field names map directly to API - systemPrompt is expected by the API
    const updates = { [fieldName]: newValue }

    // Call API through store
    const result = await agentsStore.updateAgent(
      props.projectId,
      props.selectedItem.name,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local agentData
      agentData.value[fieldName] = newValue

      // Notify parent that agent was updated
      emit('agent-updated')
    }
  } finally {
    editingField.value = null
  }
}

// Handle command field update
const handleCommandFieldUpdate = async (fieldName, newValue) => {
  if (!canEditCommand.value) return

  try {
    // Build updates object
    // Note: Backend expects camelCase field names (argumentHint, allowedTools, disableModelInvocation)
    // Backend handles the conversion to kebab-case for YAML frontmatter internally
    const updates = { [fieldName]: newValue }

    // Get the command path (construct from namespace + name + .md)
    // Commands have: { name: 'helper', namespace: 'utils', filePath: '/full/path/...' }
    // Backend expects: 'utils/helper.md' or 'helper.md' (relative path)
    const commandPath = props.selectedItem.namespace
      ? `${props.selectedItem.namespace}/${props.selectedItem.name}.md`
      : `${props.selectedItem.name}.md`

    // Call API through store
    const result = await commandsStore.updateCommand(
      props.scope,
      props.projectId,
      commandPath,
      updates
    )

    if (result.success) {
      // Update local commandData
      commandData.value[fieldName] = newValue

      // Notify parent that command was updated
      emit('command-updated')
    }
  } finally {
    editingField.value = null
  }
}

// Handle skill field update
const handleSkillFieldUpdate = async (fieldName, newValue) => {
  if (!canEditSkill.value) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }

    // Extract skill directory name from directoryPath
    // Skills are identified by their directory name (e.g., 'write-file'), not display name
    const skillDirName = props.selectedItem.directoryPath
      ? props.selectedItem.directoryPath.split('/').pop()
      : props.selectedItem.name

    // Call API through store
    const result = await skillsStore.updateSkill(
      props.projectId,
      skillDirName,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local skillData
      skillData.value[fieldName] = newValue

      // Notify parent that skill was updated
      emit('skill-updated')
    }
  } finally {
    editingField.value = null
  }
}

// Handle hook field update
const handleHookFieldUpdate = async (fieldName, newValue) => {
  if (!canEditHook.value) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }

    // Build hookId from the selected item
    // Hook items should have: event, matcher (optional), index
    const hookId = `${props.selectedItem.event}::${props.selectedItem.matcher || ''}::${props.selectedItem.index || 0}`

    // Call API through store
    const result = await hooksStore.updateHook(
      props.projectId,
      hookId,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local hookData
      hookData.value[fieldName] = newValue

      // Notify parent that hook was updated
      emit('hook-updated')
    }
  } finally {
    editingField.value = null
  }
}

// Handle MCP field update
const handleMcpFieldUpdate = async (fieldName, newValue) => {
  if (!canEditMcp.value) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }

    // Call API through store
    const result = await mcpStore.updateMcpServer(
      props.projectId,
      props.selectedItem.name,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local mcpData
      mcpData.value[fieldName] = newValue

      // Notify parent that MCP server was updated
      emit('mcp-updated')
    }
  } finally {
    editingField.value = null
  }
}

// Handle delete button click
const handleDelete = () => {
  if (canEdit.value && props.selectedItem) {
    emit('agent-delete', props.selectedItem)
  } else if (canEditCommand.value && props.selectedItem) {
    emit('command-delete', props.selectedItem)
  } else if (canEditSkill.value && props.selectedItem) {
    emit('skill-delete', props.selectedItem)
  } else if (canEditHook.value && props.selectedItem) {
    emit('hook-delete', props.selectedItem)
  }
}

// Computed: navigation state
const hasPrev = computed(() => props.selectedIndex > 0)
const hasNext = computed(() => props.selectedIndex < props.currentItems.length - 1)

// Computed: type icon
const typeIcon = computed(() => {
  const icons = {
    agents: 'pi pi-users',
    commands: 'pi pi-bolt',
    hooks: 'pi pi-link',
    mcp: 'pi pi-server',
    skills: 'pi pi-sparkles'
  }
  return icons[props.selectedType] || 'pi pi-file'
})

// Computed: type color
const typeColor = computed(() => {
  // For agents, use the defined color if available
  if (props.selectedType === 'agents' && props.selectedItem?.color) {
    return props.selectedItem.color
  }

  // Otherwise use default type colors
  const colors = {
    agents: 'var(--color-agents)',
    commands: 'var(--color-commands)',
    hooks: 'var(--color-hooks)',
    mcp: 'var(--color-mcp)',
    skills: 'var(--color-skills)'
  }
  return colors[props.selectedType] || 'var(--text-primary)'
})

// Navigation handlers
const handleNavigatePrev = () => {
  if (hasPrev.value) {
    emit('navigate', 'prev')
  }
}

const handleNavigateNext = () => {
  if (hasNext.value) {
    emit('navigate', 'next')
  }
}

// Calculate indentation level for file tree based on path depth
const getIndentLevel = (relativePath) => {
  if (!relativePath) return 0
  const depth = (relativePath.match(/\//g) || []).length
  return depth * 1.25 // 1.25rem per level
}

// Handle copy button click
const handleCopy = () => {
  if (props.selectedItem) {
    // Convert selectedType from plural ('agents', 'commands') to singular ('agent', 'command')
    const typeMapping = {
      'agents': 'agent',
      'commands': 'command',
      'hooks': 'hook',
      'mcp': 'mcp',
      'skills': 'skill'
    };

    // Use configType to avoid overwriting hook's type field
    const itemWithType = {
      ...props.selectedItem,
      configType: typeMapping[props.selectedType] || props.selectedType
    };

    emit('copy-clicked', itemWithType)
  }
}
</script>

<style scoped>
/* PrimeVue Drawer Styling */

/* Drawer container - responsive width */
:deep(.p-drawer) {
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-primary);
  box-shadow: var(--shadow-card);
}

/* Overlay/mask styling */
:deep(.p-drawer-mask) {
  background: rgba(0, 0, 0, 0.5);
}

/* Header styling */
:deep(.p-drawer-header) {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

:deep(.p-drawer-title) {
  display: none; /* We use custom header content */
}

/* Content area */
:deep(.p-drawer-content) {
  background: var(--bg-secondary);
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Footer styling */
:deep(.p-drawer-footer) {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  padding: 1rem 1.5rem;
}

/* Navigation buttons in header */
.nav-btn {
  width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
  background: transparent !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: 0.25rem !important;
  color: var(--text-primary) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-primary) !important;
  border-color: var(--color-primary) !important;
}

.nav-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

/* Sidebar action buttons (footer) - icon-only outlined style */
.sidebar-action-btn {
  width: 2.5rem !important;
  height: 2.5rem !important;
  padding: 0 !important;
  transition: all 0.2s !important;
}

.sidebar-action-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

/* Copy action button */
.copy-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--color-primary) !important;
  border: 1px solid var(--color-primary) !important;
}

.copy-action-btn:hover:not(:disabled) {
  background: var(--color-primary) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Delete action button */
.delete-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--color-error) !important;
  border: 1px solid var(--color-error) !important;
}

.delete-action-btn:hover:not(:disabled) {
  background: var(--color-error) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Close action button */
.close-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-primary) !important;
}

.close-action-btn:hover {
  background: var(--bg-hover) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Skills Structure Accordion */
.skill-structure-accordion {
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.skill-structure-accordion .p-accordionheader) {
  background: var(--bg-tertiary) !important;
  border: none !important;
  padding: 0.75rem 1rem !important;
}

:deep(.skill-structure-accordion .p-accordionheader:hover) {
  background: var(--bg-hover) !important;
}

:deep(.skill-structure-accordion .p-accordioncontent-content) {
  background: var(--bg-primary) !important;
  border-top: 1px solid var(--border-primary) !important;
  padding: 0.75rem !important;
  max-height: 300px;
  overflow-y: auto;
}

/* File Tree Styling */
.file-tree {
  font-family: var(--font-mono);
}

.file-tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-radius: 0.25rem;
  transition: background 0.15s;
}

.file-tree-item:hover {
  background: var(--bg-hover);
}

.file-tree-item.directory {
  font-weight: 500;
}

.file-tree-item i {
  font-size: 0.875rem;
  width: 1rem;
  text-align: center;
}
</style>
