# vim-marks

A Visual Studio Code extension that brings Vim-style marks functionality to VS Code, allowing you to set and jump between marks in your code. It's created in response to inability of [VSCodeVim/Vim](https://github.com/VSCodeVim/Vim) to provide proper marks solution and is based on [spacian/vim-marks](https://github.com/spacian/vim-marks) extension, but I've added some features that I think were missing.
The original project doesn't seem to be maintained anymore, so I've decided to create my own fork.


## Features

- Create marks using letters (a-z, A-Z) to bookmark specific locations in your code
- Quickly jump between marks
- View all existing marks
- Delete individual marks or all marks at once
- Vim-like mark mode for faster mark operations
- Intersession marks persistence
- Marks are automatically saved and updated when you change the file containing them
- Overwrites vim extension marks

## Commands

The extension provides the following commands:

- `vim-marks: create mark` - Create a new mark at the current cursor position
- `vim-marks: jump to mark` - Jump to a specific mark
- `vim-marks: show marks` - Display all existing marks
- `vim-marks: delete mark` - Delete a specific mark
- `vim-marks: delete all marks` - Delete all existing marks

## Usage

1. **Creating a Mark**:
   - Use the command palette (`Cmd/Ctrl + Shift + P`) and select "vim-marks: create mark"
   - Enter a letter (a-z for file-local marks, A-Z for global marks)
   - The mark will be created at your current cursor position

2. **Jumping to a Mark**:
   - Use the command palette and select "vim-marks: jump to mark"
   - Enter the letter of the mark you want to jump to
   - The cursor will move to the marked position

3. **Managing Marks**:
   - View all marks using the "show marks" command
   - Delete individual marks or use "delete all marks" to clear all marks

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Cmd/Ctrl + P` to open the Quick Open dialog
3. Type `ext install spacian.vim-marks`
4. Press Enter to install

### From VSIX file
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `vsce package` to create the VSIX file
4. In VS Code, press `Cmd/Ctrl + Shift + P` and select "Extensions: Install from VSIX..."
5. Navigate to and select the generated .vsix file

## Extension Settings

This extension contributes the following commands that can be bound to keyboard shortcuts:

```json
{
    "vim-marks.create_mark": "Create a new mark",
    "vim-marks.jump_to_mark": "Jump to an existing mark",
    "vim-marks.delete_mark": "Delete a mark",
    "vim-marks.delete_all_marks": "Delete all marks",
    "vim-marks.show_marks": "Show all marks"
}
```

## Known Issues

Please report any issues on the [GitHub repository](https://github.com/kwojdalski/vim-marks/issues).

## Release Notes

### 0.0.1

- Initial release
- Basic mark functionality (create, jump, delete)
- Support for both lowercase (file-local) and uppercase (global) marks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the [MIT License](LICENSE).
