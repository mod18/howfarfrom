import ipywidgets as widgets

from IPython.display import display


class NotebookUI():
    def __init__(self):
        self.ui = self._build_shell_ui()
        display(self.ui)
    
    def __repr__(self):
        return "NotebookUI"

    def _build_shell_ui(self) -> widgets.HBox:
        pass
