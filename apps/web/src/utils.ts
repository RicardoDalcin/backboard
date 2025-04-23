let opfsRoot: FileSystemDirectoryHandle | null = null;

export async function createFileTest() {
  if (opfsRoot == null) {
    opfsRoot = await navigator.storage.getDirectory();
  }

  // fetch with compression
  const url =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRrpm3dxcaL40zYZTcws8SuWH6vUFBfnKOyhj5';
  const response = await fetch(url);
  const compressedBlob = await response.blob();

  console.log(compressedBlob.size);

  const decompressionStream = new DecompressionStream('gzip');

  const streamedResponse = new Response(
    compressedBlob.stream().pipeThrough(decompressionStream),
  );
  const blob = await streamedResponse.blob();
  console.log(blob.size);

  // if (!response.ok || !response.body) {
  //   throw new Error(`Failed to fetch: ${response.status}`);
  // }

  // const reader = response.body.getReader();

  // const stream = new ReadableStream({
  //   start(controller) {
  //     function push() {
  //       reader
  //         .read()
  //         .then(({ done, value }) => {
  //           if (done) {
  //             console.log('Stream complete');
  //             controller.close();
  //             return;
  //           }
  //           controller.enqueue(value);
  //           push();
  //         })
  //         .catch((err) => {
  //           console.error('Stream error:', err);
  //           controller.error(err);
  //         });
  //     }
  //     push();
  //   },
  // });

  // const decompressionStream = new DecompressionStream('gzip');

  // const streamedResponse = new Response(
  //   stream.pipeThrough(decompressionStream),
  // );
  // const blob = await streamedResponse.blob();
  // console.log(blob.size);

  // // Trigger browser download
  // const blobUrl = URL.createObjectURL(blob);
  // const a = document.createElement('a');
  // a.href = blobUrl;
  // a.download = filename;
  // document.body.appendChild(a);
  // a.click();
  // a.remove();
  // URL.revokeObjectURL(blobUrl);

  // ----
  // try {
  //   const fileHandle = await opfsRoot.getFileHandle('./nba_db.sqlite', {
  //     create: false,
  //   });
  //   const file = await fileHandle.getFile();
  //   console.log('file', file);

  //   // Create a Blob from the file
  //   const blob = await file.arrayBuffer();
  //   console.log(blob, 'blob');

  //   // Create a URL for the Blob and download the file
  //   const url = URL.createObjectURL(new Blob([blob]));
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'nba_db.sqlite';
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // } catch (error) {
  //   console.error('Error accessing file:', error);
  // }
  // ----

  // Uncomment the rest of the code if you need it for other functionality
  // const sqliteFile = await fetch('/nba.sqlite');
  // const blob = await sqliteFile.blob();
  // console.log('read blob');

  // const fileHandle = await opfsRoot.getFileHandle('nba_db.sqlite', {
  //   create: true,
  // });
  // console.log('got file handle');

  // const writable = await fileHandle.createWritable();
  // await writable.write(blob);
  // await writable.close();
  // console.log('file written');

  // const fileHandle = await opfsRoot.getFileHandle("text.txt", {
  //   create: true,
  // });

  // const file = await fileHandle.getFile();
  // // log file content
  // const text = await file.text();

  // console.log("file text", text);

  // const writable = await fileHandle.createWritable();
  // await writable.write(text + " Hello World!");
  // await writable.close();
}
