"""Maintenance tool: convert verified WebR binary archives to WORKERFS images.
Uses only Python's standard library; normal dev/build only verifies the outputs.
"""
from pathlib import Path, PurePosixPath
import gzip, hashlib, json, tarfile
root=Path(__file__).resolve().parent.parent
lock=json.loads((root/'r-packages.lock.json').read_text())
out=root/'public/r-packages';out.mkdir(exist_ok=True)
images=[]
for pkg in lock['packages']:
    archive=root/'vendor/r-packages'/pkg['file']
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==pkg['sha256'],pkg['name']
    data=bytearray();files=[]
    with tarfile.open(archive,'r:gz') as tar:
        for item in tar:
            if item.isdir():continue
            assert item.isfile(),f'Unexpected non-file: {item.name}'
            path=PurePosixPath(item.name)
            assert not path.is_absolute() and '..' not in path.parts
            start=len(data);data.extend(tar.extractfile(item).read())
            files.append(dict(filename='/'+str(path),start=start,end=len(data)))
    blob=gzip.compress(bytes(data),mtime=0)
    meta=json.dumps(dict(files=files,remote_package_size=len(data)),separators=(',',':')).encode()
    stem=pkg['name']+'-'+pkg['version']
    (out/(stem+'.data.bin')).write_bytes(blob);(out/(stem+'.metadata.json')).write_bytes(meta)
    images.append(dict(name=pkg['name'],version=pkg['version'],data=stem+'.data.bin',metadata=stem+'.metadata.json',sha256=hashlib.sha256(blob).hexdigest(),metadataSha256=hashlib.sha256(meta).hexdigest(),bytes=len(blob)))
(root/'r-package-images.lock.json').write_text(json.dumps(dict(runtime=lock['runtime'],images=images),indent=2)+'\n')
print('Built',len(images),'verified WORKERFS images')
