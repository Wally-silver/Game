import { Button, Canvas, Color, Label, Layers, Layout, Node, UITransform, Vec3, Widget, director, view } from 'cc';

export class SceneUIFactory {
  public static ensureCanvasFor(node: Node): Node | null {
    let cursor: Node | null = node;
    while (cursor) {
      if (cursor.getComponent(Canvas)) return cursor;
      cursor = cursor.parent;
    }

    const scene = director.getScene();
    if (!scene) {
      console.error('[SceneUIFactory] scene is null while ensuring canvas');
      return null;
    }

    const existed = scene.getChildByName('Canvas');
    if (existed) return existed;

    const canvas = new Node('Canvas');
    canvas.parent = scene;
    canvas.addComponent(Canvas);
    const trans = canvas.addComponent(UITransform);
    const visible = view.getVisibleSize();
    trans.setContentSize(Math.max(1, visible.width), Math.max(1, visible.height));
    console.warn('[SceneUIFactory] Canvas not found, created runtime Canvas');
    return canvas;
  }

  public static ensureFullScreenRoot(root: Node): void {
    const canvas = this.ensureCanvasFor(root);
    if (!canvas) return;

    const canvasTrans = canvas.getComponent(UITransform) ?? canvas.addComponent(UITransform);
    const visible = view.getVisibleSize();
    const cw = canvasTrans.width > 0 ? canvasTrans.width : visible.width;
    const ch = canvasTrans.height > 0 ? canvasTrans.height : visible.height;
    canvasTrans.setContentSize(cw, ch);

    const rootTrans = root.getComponent(UITransform) ?? root.addComponent(UITransform);
    if (rootTrans.width <= 100 || rootTrans.height <= 100) {
      console.warn(`[SceneUIFactory] root size abnormal ${rootTrans.width}x${rootTrans.height}, auto fix`);
    }
    rootTrans.setContentSize(cw, ch);

    root.setPosition(Vec3.ZERO);
    root.setScale(1, 1, 1);
    this.setNodeLayerRecursively(root, Layers.Enum.UI_2D);

    const widget = root.getComponent(Widget) ?? root.addComponent(Widget);
    widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
    widget.top = widget.bottom = widget.left = widget.right = 0;
    widget.updateAlignment();

    console.log(`[SceneUIFactory] fullscreen root prepared: ${root.name} size=${Math.round(cw)}x${Math.round(ch)}`);
  }

  public static ensureRootOnce(parent: Node, name: string): Node {
    return parent.getChildByName(name) ?? (() => { const n = new Node(name); n.parent = parent; return n; })();
  }

  public static ensureSafePanel(parent: Node, name: string, options?: { width?: number; height?: number }): Node {
    const visible = view.getVisibleSize();
    const w = Math.min(options?.width ?? visible.width * 0.94, visible.width);
    const h = Math.min(options?.height ?? visible.height * 0.94, visible.height);
    const panel = this.ensureRootOnce(parent, name);
    const trans = panel.getComponent(UITransform) ?? panel.addComponent(UITransform);
    trans.setContentSize(Math.max(100, w), Math.max(100, h));
    panel.setPosition(0, 0, 0);
    this.setNodeLayerRecursively(panel, Layers.Enum.UI_2D);
    return panel;
  }

  public static ensurePanel(parent: Node, name: string, width = 720, height = 1280): Node {
    return this.ensureSafePanel(parent, name, { width, height });
  }

  public static createPanel(parent: Node, name: string, width = 720, height = 1280): Node {
    return this.ensurePanel(parent, name, width, height);
  }

  public static ensureVerticalGroup(parent: Node, name: string, spacingY = 12): Node {
    const node = this.ensureRootOnce(parent, name);
    const layout = node.getComponent(Layout) ?? node.addComponent(Layout);
    layout.type = Layout.Type.VERTICAL;
    layout.spacingY = spacingY;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    layout.paddingTop = layout.paddingBottom = layout.paddingLeft = layout.paddingRight = 8;
    return node;
  }

  public static ensureHorizontalGroup(parent: Node, name: string, spacingX = 12): Node {
    const node = this.ensureRootOnce(parent, name);
    const layout = node.getComponent(Layout) ?? node.addComponent(Layout);
    layout.type = Layout.Type.HORIZONTAL;
    layout.spacingX = spacingX;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    return node;
  }

  public static createVerticalLayout(parent: Node, name: string, spacingY = 12): Node {
    return this.ensureVerticalGroup(parent, name, spacingY);
  }

  public static ensureLabel(parent: Node, name: string, text: string, fontSize = 24): Label {
    const node = this.ensureRootOnce(parent, name);
    const trans = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    trans.setContentSize(Math.max(240, text.length * Math.max(10, fontSize * 0.8)), Math.max(36, fontSize + 12));
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    return label;
  }

  public static createLabel(parent: Node, name: string, text: string, fontSize = 24): Label {
    return this.ensureLabel(parent, name, text, fontSize);
  }

  public static ensureButton(parent: Node, name: string, text: string, cb?: () => void): { node: Node; button: Button; label: Label } {
    const node = this.ensureRootOnce(parent, name);
    const trans = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    trans.setContentSize(240, 60);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.string = text;
    label.fontSize = 22;
    label.color = new Color(255, 255, 255, 255);
    if (cb) this.bindSingleClick(node, cb);
    return { node, button, label };
  }

  public static createButton(parent: Node, name: string, text: string, cb?: () => void): { node: Node; button: Button; label: Label } {
    return this.ensureButton(parent, name, text, cb);
  }

  public static bindSingleClick(target: Node | Button, handler: () => void): void {
    const node = target instanceof Button ? target.node : target;
    node.off(Button.EventType.CLICK);
    node.on(Button.EventType.CLICK, () => {
      try { handler(); } catch (error) { console.error('[SceneUIFactory] click handler error', error); }
    });
  }

  public static clearChildren(parent: Node): void {
    parent.removeAllChildren();
  }

  public static clearChildrenButKeepTemplate(parent: Node, templateName?: string): void {
    parent.children.forEach((child) => {
      if (!templateName || child.name !== templateName) child.destroy();
    });
  }

  public static setNodeLayerRecursively(node: Node, layer: number): void {
    node.layer = layer;
    node.children.forEach((child) => this.setNodeLayerRecursively(child, layer));
  }
}
