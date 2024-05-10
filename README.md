## Features

This extension imitates local and global marks of VIM. Marks let you jump to positions
in the code you marked earlier. Local marks only work on the file that is currently
focused, while global marks allow for jumping between files.

Currently, you can create marks and jump to marks. Marks are not persistent between
sessions.

In contrast to VIM, lower letters default to global marks, because I prefer it that way.


## Extension Settings

* `vim-marks.upper_case_for_local_marks`: Defaults to `true`. Set to `false` to restore
  default VIM behavior.


## Release Notes

### 0.0.1

- Initial release
