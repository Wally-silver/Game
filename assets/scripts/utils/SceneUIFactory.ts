import { Button, Color, Label, Layout, Node, UITransform } from 'cc';

export class SceneUIFactory {
  public static ensureRootOnce(parent: Node, name: string): Node {
    return parent.getChildByName(name) ?? (() => { const n = new Node(name); n.parent = parent; return n; })();
  }
  public static ensurePanel(parent: Node, name: string, width = 720, height = 1280): Node {
    const existed = parent.getChildByName(name);
    if (existed) {
      const trans = existed.getComponent(UITransform) ?? existed.addComponent(UITransform);
      trans.setContentSize(width, height);
      return existed;
    }
    const node = new Node(name);
    const trans = node.addComponent(UITransform);
    trans.setContentSize(width, height);
    node.parent = parent;
    return node;
  }

  public static createPanel(parent: Node, name: string, width = 720, height = 1280): Node {
    return this.ensurePanel(parent, name, width, height);
  }

  public static ensureVerticalGroup(parent: Node, name: string, spacingY = 12): Node {
    const existed = parent.getChildByName(name);
    const node = existed ?? new Node(name);
    const layout = node.getComponent(Layout) ?? node.addComponent(Layout);
    layout.type = Layout.Type.VERTICAL;
    layout.spacingY = spacingY;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    if (!existed) {
      node.parent = parent;
    }
    return node;
  }

  public static createVerticalLayout(parent: Node, name: string, spacingY = 12): Node {
    return this.ensureVerticalGroup(parent, name, spacingY);
  }

  public static ensureHorizontalGroup(parent: Node, name: string, spacingX = 12): Node {
    const existed = parent.getChildByName(name);
    const node = existed ?? new Node(name);
    const layout = node.getComponent(Layout) ?? node.addComponent(Layout);
    layout.type = Layout.Type.HORIZONTAL;
    layout.spacingX = spacingX;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    if (!existed) node.parent = parent;
    return node;
  }

  public static ensureLabel(parent: Node, name: string, text: string, fontSize = 24): Label {
    const existed = parent.getChildByName(name);
    const node = existed ?? new Node(name);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = new Color(255, 255, 255, 255);
    if (!existed) {
      node.parent = parent;
    }
    return label;
  }

  public static createLabel(parent: Node, name: string, text: string, fontSize = 24): Label {
    return this.ensureLabel(parent, name, text, fontSize);
  }

  public static ensureButton(parent: Node, name: string, text: string): { node: Node; button: Button; label: Label } {
    const existed = parent.getChildByName(name);
    const node = existed ?? new Node(name);
    const trans = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    trans.setContentSize(280, 56);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.string = text;
    label.fontSize = 22;
    if (!existed) {
      node.parent = parent;
    }
    return { node, button, label };
  }

  public static createButton(parent: Node, name: string, text: string): { node: Node; button: Button; label: Label } {
    return this.ensureButton(parent, name, text);
  }

  public static bindSingleClick(node: Node, cb: () => void): void {
    node.off(Button.EventType.CLICK);
    node.on(Button.EventType.CLICK, cb);
  }

  public static clearChildrenButKeepTemplate(parent: Node, templateName: string): void {
    parent.children.forEach((child) => { if (child.name !== templateName) child.destroy(); });
  }

}
