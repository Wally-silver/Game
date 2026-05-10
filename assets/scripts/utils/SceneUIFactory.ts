import { Button, Color, Label, Layout, Node, UITransform } from 'cc';

export class SceneUIFactory {
  public static createPanel(parent: Node, name: string, width = 720, height = 1280): Node {
    const node = new Node(name);
    const trans = node.addComponent(UITransform);
    trans.setContentSize(width, height);
    node.parent = parent;
    return node;
  }

  public static createVerticalLayout(parent: Node, name: string, spacingY = 12): Node {
    const node = new Node(name);
    const layout = node.addComponent(Layout);
    layout.type = Layout.Type.VERTICAL;
    layout.spacingY = spacingY;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    node.parent = parent;
    return node;
  }

  public static createLabel(parent: Node, name: string, text: string, fontSize = 24): Label {
    const node = new Node(name);
    node.parent = parent;
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = new Color(255, 255, 255, 255);
    return label;
  }

  public static createButton(parent: Node, name: string, text: string): { node: Node; button: Button; label: Label } {
    const node = new Node(name);
    node.parent = parent;
    node.addComponent(UITransform).setContentSize(280, 56);
    const button = node.addComponent(Button);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = 22;
    return { node, button, label };
  }

}
