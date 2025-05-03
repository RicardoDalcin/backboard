export class FileSystem {
  private opfsRoot: FileSystemDirectoryHandle | null = null;

  constructor() {}

  async fileExists(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    try {
      const fileHandle = await this.opfsRoot.getFileHandle(path, {
        create: false,
      });

      return fileHandle.kind === 'file';
    } catch {
      return false;
    }
  }

  async getFileSize(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    try {
      const fileHandle = await this.opfsRoot.getFileHandle(path, {
        create: false,
      });

      const file = await fileHandle.getFile();
      return file.size;
    } catch {
      return 0;
    }
  }

  async deleteFile(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    if (!this.fileExists(path)) {
      return;
    }

    return this.opfsRoot.removeEntry(path);
  }

  async createFile(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    const fileHandle = await this.opfsRoot.getFileHandle(path, {
      create: true,
    });

    return fileHandle;
  }
}
