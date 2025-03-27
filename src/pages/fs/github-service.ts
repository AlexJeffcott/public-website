import { effect, signal } from '@preact/signals'
import { type FSNode } from '@/types/fs.ts'

export const isGitHubBusy = signal(false)
export const gitHubStatus = signal<string>('')
export const lastSyncCommitSha = signal<string>(
	localStorage.getItem('lastSyncCommitSha') || '',
)

effect(() => {
	localStorage.setItem('lastSyncCommitSha', lastSyncCommitSha.value)
})

interface GitHubConfig {
	owner: string
	repo: string
	branch: string
}

export const gitHubConfig = signal<GitHubConfig>({
	owner: '',
	repo: '',
	branch: 'main',
})

// Get GitHub PAT from localStorage
const getToken = (): string => {
	return localStorage.getItem('githubpat') || ''
}

// Basic headers for GitHub API
const getHeaders = () => {
	const token = getToken()
	return {
		'Authorization': `token ${token}`,
		'Accept': 'application/vnd.github.v3+json',
		'Content-Type': 'application/json',
	}
}

// Get the current commit SHA of the branch
export async function getLatestCommitSha(): Promise<string> {
	const { owner, repo, branch } = gitHubConfig.value

	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
			{ headers: getHeaders() },
		)

		if (!response.ok) {
			throw new Error(
				`Failed to get latest commit: ${response.statusText}`,
			)
		}

		const data = await response.json()
		return data.commit.sha
	} catch (error) {
		gitHubStatus.value =
			`Error getting latest commit: ${error.message}`
		throw error
	}
}

// Get the current tree SHA
export async function getTreeSha(commitSha: string): Promise<string> {
	const { owner, repo } = gitHubConfig.value

	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`,
			{ headers: getHeaders() },
		)

		if (!response.ok) {
			throw new Error(
				`Failed to get tree: ${response.statusText}`,
			)
		}

		const data = await response.json()
		return data.tree.sha
	} catch (error) {
		gitHubStatus.value = `Error getting tree: ${error.message}`
		throw error
	}
}

// Get the full tree with content
export async function getFullTree(
	treeSha: string,
	recursive: boolean = true,
): Promise<any> {
	const { owner, repo } = gitHubConfig.value

	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}${
				recursive ? '?recursive=1' : ''
			}`,
			{ headers: getHeaders() },
		)

		if (!response.ok) {
			throw new Error(
				`Failed to get full tree: ${response.statusText}`,
			)
		}

		return await response.json()
	} catch (error) {
		gitHubStatus.value = `Error getting full tree: ${error.message}`
		throw error
	}
}

// Get file content from GitHub
export async function getFileContent(path: string): Promise<string> {
	const { owner, repo, branch } = gitHubConfig.value

	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
			{ headers: getHeaders() },
		)

		if (!response.ok) {
			throw new Error(
				`Failed to get file content: ${response.statusText}`,
			)
		}

		const data = await response.json()
		// GitHub returns base64 encoded content
		return decodeURIComponent(escape(atob(data.content)))
	} catch (error) {
		gitHubStatus.value =
			`Error getting file content: ${error.message}`
		throw error
	}
}

// Create a new tree based on the file system
export async function createTree(
	baseTreeSha: string,
	fsNode: FSNode[],
	read: (path: string) => Promise<string | ArrayBuffer>,
): Promise<string> {
	const { owner, repo } = gitHubConfig.value

	try {
		// Flatten the file system and prepare tree entries
		const treeEntries = await prepareTreeEntries(fsNode, read)

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/trees`,
			{
				method: 'POST',
				headers: getHeaders(),
				body: JSON.stringify({
					base_tree: baseTreeSha,
					tree: treeEntries,
				}),
			},
		)

		if (!response.ok) {
			throw new Error(
				`Failed to create tree: ${response.statusText}`,
			)
		}

		const data = await response.json()
		return data.sha
	} catch (error) {
		gitHubStatus.value = `Error creating tree: ${error.message}`
		throw error
	}
}

// Helper to prepare tree entries from FSNodes
async function prepareTreeEntries(
	fsNodes: FSNode[],
	read: (path: string) => Promise<string | ArrayBuffer>,
	basePath: string = '',
): Promise<Array<any>> {
	let entries: Array<any> = []

	for (const node of fsNodes) {
		const path = basePath ? `${basePath}/${node.name}` : node.name

		if (node.kind === 'directory' && node.children) {
			// Recursively process directory children
			const childEntries = await prepareTreeEntries(
				node.children,
				read,
				path,
			)
			entries = [...entries, ...childEntries]
		} else if (node.kind === 'file') {
			// Process file
			const content = await read(node.path)
			let base64Content: string

			if (typeof content === 'string') {
				base64Content = btoa(
					unescape(encodeURIComponent(content)),
				)

				entries.push({
					path,
					mode: '100644', // Regular file
					type: 'blob',
					content,
				})
			} else {
				// Handle binary data
				const bytes = new Uint8Array(content)
				let binary = ''
				for (let i = 0; i < bytes.byteLength; i++) {
					binary += String.fromCharCode(bytes[i])
				}
				entries.push({
					path,
					mode: '100644', // Regular file
					type: 'blob',
					content: btoa(binary),
				})
			}
		}
	}

	return entries
}

// Create a commit
export async function createCommit(
	treeSha: string,
	parentCommitSha: string,
): Promise<string> {
	const { owner, repo } = gitHubConfig.value

	try {
		const commitMessage = `Update at ${new Date().toISOString()}`

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/commits`,
			{
				method: 'POST',
				headers: getHeaders(),
				body: JSON.stringify({
					message: commitMessage,
					tree: treeSha,
					parents: [parentCommitSha],
				}),
			},
		)

		if (!response.ok) {
			throw new Error(
				`Failed to create commit: ${response.statusText}`,
			)
		}

		const data = await response.json()
		return data.sha
	} catch (error) {
		gitHubStatus.value = `Error creating commit: ${error.message}`
		throw error
	}
}

// Update reference (branch)
export async function updateReference(commitSha: string): Promise<void> {
	const { owner, repo, branch } = gitHubConfig.value

	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
			{
				method: 'PATCH',
				headers: getHeaders(),
				body: JSON.stringify({
					sha: commitSha,
					force: false,
				}),
			},
		)

		if (!response.ok) {
			throw new Error(
				`Failed to update reference: ${response.statusText}`,
			)
		}

		gitHubStatus.value = 'Successfully pushed to GitHub'
	} catch (error) {
		gitHubStatus.value =
			`Error updating reference: ${error.message}`
		throw error
	}
}

// Main function to commit changes
export async function commitChanges(
	rootNode: FSNode,
	read: (path: string) => Promise<string | ArrayBuffer>,
): Promise<string> {
	isGitHubBusy.value = true
	gitHubStatus.value = 'Committing changes...'

	try {
		const latestCommitSha = await getLatestCommitSha()
		const baseTreeSha = await getTreeSha(latestCommitSha)

		// Prepare the file system for GitHub
		const fsNodes =
			rootNode.kind === 'directory' && rootNode.children
				? rootNode.children
				: [rootNode]

		const newTreeSha = await createTree(baseTreeSha, fsNodes, read)
		const newCommitSha = await createCommit(
			newTreeSha,
			latestCommitSha,
		)

		gitHubStatus.value = 'Changes committed successfully'
		return newCommitSha
	} catch (error) {
		gitHubStatus.value = `Commit failed: ${error.message}`
		throw error
	} finally {
		isGitHubBusy.value = false
	}
}

// Push the latest commit
export async function pushChanges(commitSha: string): Promise<void> {
	isGitHubBusy.value = true
	gitHubStatus.value = 'Pushing changes...'

	try {
		await updateReference(commitSha)
		gitHubStatus.value = 'Changes pushed successfully'
	} catch (error) {
		gitHubStatus.value = `Push failed: ${error.message}`
		throw error
	} finally {
		isGitHubBusy.value = false
	}
}

// Compare two commits to get changed files
export async function getChangedFiles(): Promise<string[]> {
	isGitHubBusy.value = true
	gitHubStatus.value = 'Checking for changes...'

	try {
		const { owner, repo } = gitHubConfig.value

		// If we don't have a last sync commit, we can't determine changes
		if (!lastSyncCommitSha.value) {
			gitHubStatus.value = 'No previous sync point found'
			return []
		}

		const latestCommitSha = await getLatestCommitSha()

		// If the latest commit is the same as our last sync, nothing has changed
		if (latestCommitSha === lastSyncCommitSha.value) {
			gitHubStatus.value = 'No changes since last sync'
			return []
		}

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/compare/${lastSyncCommitSha.value}...${latestCommitSha}`,
			{ headers: getHeaders() },
		)

		if (!response.ok) {
			throw new Error(
				`Failed to compare commits: ${response.statusText}`,
			)
		}

		const data = await response.json()

		// Extract the file paths from the comparison
		const changedFiles = data.files.map((file: any) =>
			file.filename
		)

		gitHubStatus.value =
			`Found ${changedFiles.length} changed files`
		return changedFiles
	} catch (error) {
		gitHubStatus.value =
			`Error checking for changes: ${error.message}`
		throw error
	} finally {
		isGitHubBusy.value = false
	}
}

// Pull changes from GitHub to local filesystem
export async function pullChanges(fsHandlers: any): Promise<void> {
	isGitHubBusy.value = true
	gitHubStatus.value = 'Pulling changes from GitHub...'

	try {
		// Get the latest commit SHA
		const latestCommitSha = await getLatestCommitSha()

		// Get the tree SHA for this commit
		const treeSha = await getTreeSha(latestCommitSha)

		// Get the full tree with all files
		const fullTree = await getFullTree(treeSha)

		// Process each file in the tree
		for (const item of fullTree.tree) {
			if (item.type === 'blob') {
				// This is a file
				const path = `/${item.path}`

				// Check if the file exists locally
				const fileExists = await fsHandlers.existsFile(
					path,
				)

				// Get the content from GitHub
				const content = await getFileContent(item.path)

				if (fileExists) {
					// Update the existing file
					await fsHandlers.write(path, content)
				} else {
					// Create directories if needed
					const dirPath = path.substring(
						0,
						path.lastIndexOf('/'),
					)
					if (dirPath) {
						const dirExists =
							await fsHandlers
								.existsDirectory(
									dirPath,
								)
						if (!dirExists) {
							await fsHandlers
								.createDirectory(
									dirPath,
								)
						}
					}

					// Create the new file
					await fsHandlers.write(path, content)
				}
			} else if (item.type === 'tree') {
				// This is a directory
				const dirPath = `/${item.path}`
				const dirExists = await fsHandlers
					.existsDirectory(dirPath)

				if (!dirExists) {
					await fsHandlers.createDirectory(
						dirPath,
					)
				}
			}
		}

		// Update the last sync commit SHA
		lastSyncCommitSha.value = latestCommitSha

		gitHubStatus.value = 'Successfully pulled changes from GitHub'
	} catch (error) {
		gitHubStatus.value = `Pull failed: ${error.message}`
		throw error
	} finally {
		isGitHubBusy.value = false
	}
}
