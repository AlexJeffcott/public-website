import { useSignal } from '@preact/signals'
import {
  commitChanges,
  getChangedFiles,
  gitHubConfig,
  gitHubStatus,
  isGitHubBusy,
  lastSyncCommitSha,
  pullChanges,
  pushChanges,
} from '@/pages/fs/github-service.ts'
import classes from '@/pages/fs/github-integration.module.css'
import { useStores } from '@/contexts/stores.tsx'
import { fsHandlers } from '@/broadcast/main.ts'
import { Btn } from '@/ui-components/mod.ts'
import { useEffect, useRef } from 'preact/hooks'

export const GitHubIntegration = () => {
  const { finderStore } = useStores()

  const lastCommitSha = useSignal<string>('')
  const changedFiles = useSignal<string[]>([])
  const isLoadingChanges = useSignal(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  const handleCommit = async () => {
    if (isGitHubBusy.value) return

    try {
      const commitSha = await commitChanges(
        finderStore.ls.value,
        fsHandlers.read,
      )
      lastCommitSha.value = commitSha
    } catch (error) {
      console.error('Commit error:', error)
    }
  }

  const handlePush = async () => {
    if (isGitHubBusy.value || !lastCommitSha.value) return

    try {
      await pushChanges(lastCommitSha.value)
      // Update the last sync commit SHA after successful push
      lastSyncCommitSha.value = lastCommitSha.value
    } catch (error) {
      console.error('Push error:', error)
    }
  }

  const handleConfigChange = (
    field: keyof typeof gitHubConfig.value,
    value: string,
  ) => {
    gitHubConfig.value = {
      ...gitHubConfig.value,
      [field]: value,
    }
  }

  const handleCheckChanges = async () => {
    if (isGitHubBusy.value) return

    isLoadingChanges.value = true
    try {
      const files = await getChangedFiles()
      changedFiles.value = files

      if (popoverRef.current) {
        popoverRef.current.showPopover()
      }
    } catch (error) {
      console.error('Error checking changes:', error)
    } finally {
      isLoadingChanges.value = false
    }
  }

  const handleSyncConfirm = () => {
    if (confirmDialogRef.current) {
      confirmDialogRef.current.showModal()
    }
  }

  const handleSync = async () => {
    if (isGitHubBusy.value) return

    try {
      await pullChanges(fsHandlers)
      // Close the dialog after successful sync
      if (confirmDialogRef.current) {
        confirmDialogRef.current.close()
      }
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        popoverRef.current.matches(':popover-open')
      ) {
        popoverRef.current.hidePopover()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div class={classes.githubIntegration}>
      <h3>GitHub Integration</h3>

      <div class={classes.githubConfig}>
        <div class={classes.formGroup}>
          <label>Owner/Organization:</label>
          <input
            type='text'
            value={gitHubConfig.value.owner}
            onInput={(e) =>
              handleConfigChange('owner', (e.target as HTMLInputElement).value)}
            disabled={isGitHubBusy.value}
          />
        </div>

        <div class={classes.formGroup}>
          <label>Repository:</label>
          <input
            type='text'
            value={gitHubConfig.value.repo}
            onInput={(e) =>
              handleConfigChange('repo', (e.target as HTMLInputElement).value)}
            disabled={isGitHubBusy.value}
          />
        </div>

        <div class={classes.formGroup}>
          <label>Branch:</label>
          <input
            type='text'
            value={gitHubConfig.value.branch}
            onInput={(e) =>
              handleConfigChange(
                'branch',
                (e.target as HTMLInputElement).value,
              )}
            disabled={isGitHubBusy.value}
          />
        </div>
      </div>

      <div class={classes.githubActions}>
        <Btn
          onPress={handleCommit}
          disabled={isGitHubBusy.value || !gitHubConfig.value.owner ||
            !gitHubConfig.value.repo}
        >
          Commit Changes
        </Btn>

        <Btn
          onPress={handlePush}
          disabled={isGitHubBusy.value || !lastCommitSha.value}
        >
          Push to {gitHubConfig.value.branch}
        </Btn>

        <Btn
          onPress={handleCheckChanges}
          disabled={isGitHubBusy.value || isLoadingChanges.value ||
            !gitHubConfig.value.owner ||
            !gitHubConfig.value.repo}
        >
          Check Remote Changes
        </Btn>

        <Btn
          onPress={handleSyncConfirm}
          disabled={isGitHubBusy.value || !gitHubConfig.value.owner ||
            !gitHubConfig.value.repo}
        >
          Sync with GitHub
        </Btn>
      </div>

      {/* Popover for changed files */}
      <div
        ref={popoverRef}
        class={classes.changedFilesPopover}
        popover='auto'
      >
        <h4>Changed Files</h4>
        {changedFiles.value.length === 0
          ? <p>No changes detected since last sync</p>
          : (
            <ul class={classes.filesList}>
              {changedFiles.value.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          )}
      </div>

      {/* Confirmation dialog for sync */}
      <dialog ref={confirmDialogRef} class={classes.confirmDialog}>
        <h4>Sync with GitHub</h4>
        <p>
          This will pull all changes from GitHub and update your local files.
          Any local changes not committed may be overwritten.
        </p>
        <p>Are you sure you want to continue?</p>
        <div class={classes.dialogActions}>
          <Btn onPress={handleSync} disabled={isGitHubBusy.value}>
            Yes, Sync Now
          </Btn>
          <Btn
            onPress={() => confirmDialogRef.current?.close()}
            variant='secondary'
          >
            Cancel
          </Btn>
        </div>
      </dialog>

      <div class={classes.githubStatus}>
        <p>Status: {gitHubStatus.value}</p>
        {lastCommitSha.value && (
          <p>Last commit: {lastCommitSha.value.substring(0, 7)}</p>
        )}
        {lastSyncCommitSha.value && (
          <p>Last synced: {lastSyncCommitSha.value.substring(0, 7)}</p>
        )}
      </div>
    </div>
  )
}
