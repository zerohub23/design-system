import EvEmitter from 'ev-emitter';
import FormLabel from '../FormLabel/FormLabel';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import uniqueId from 'lodash.uniqueid';

/** Used to emit events to all Choice components */
const dsChoiceEmitter = new EvEmitter();

export class Choice extends React.PureComponent {
  constructor(props) {
    super(props);
    this.input = null;
    this.handleChange = this.handleChange.bind(this);
    this.handleUncheck = this.handleUncheck.bind(this);
    this.id = this.props.id || uniqueId(`${this.props.type}_${this.props.name}_`);

    if (typeof this.props.checked === 'undefined') {
      this.isControlled = false;
      // Since this isn't a controlled component, we need a way
      // to track when the value has changed. This can then be used
      // to identify when to toggle the visibility of (un)checkedChildren
      this.state = { checked: this.props.defaultChecked };

      // Event emitters are only relevant for uncontrolled radio buttons
      if (this.props.type === 'radio') {
        this.uncheckEventName = `${this.props.name}-uncheck`;
        dsChoiceEmitter.on(this.uncheckEventName, this.handleUncheck);
      }
    } else {
      this.isControlled = true;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Temporarily disable deprecation warning
      // if (props.children) {
      //  console.warn(
      //    `[Deprecated]: Please remove the 'children' prop in <Choice>, use 'label' instead. This prop has been renamed and will be removed in a future release.`
      //  );
      // }
    }
  }

  componentWillUnmount() {
    // Unbind event emitters are only relevant for uncontrolled radio buttons
    if (!this.isControlled && this.props.type === 'radio') {
      dsChoiceEmitter.off(this.uncheckEventName, this.handleUncheck);
    }
  }

  checked() {
    if (this.isControlled) {
      return this.props.checked;
    }

    return this.state.checked;
  }

  /**
   * A radio button doesn't receive an onChange event when it is unchecked,
   * so we fire an "uncheck" event when any radio option is selected. This
   * allows us to check each radio options' checked state.
   * @param {String} checkedId - ID of the checked radio option
   */
  handleUncheck(checkedId) {
    if (checkedId !== this.id && this.input.checked !== this.state.checked) {
      this.setState({ checked: this.input.checked });
    }
  }

  handleChange(evt) {
    if (this.props.onChange) {
      this.props.onChange(evt);
    }

    if (!this.isControlled) {
      this.setState({ checked: evt.target.checked });

      if (this.props.type === 'radio' && evt.target.checked) {
        // Emit the uncheck event so other radio options update their state
        dsChoiceEmitter.emitEvent(this.uncheckEventName, [this.id]);
      }
    }
  }

  render() {
    const {
      checkedChildren,
      children,
      className,
      disabled,
      hint,
      inversed,
      inputClassName,
      label,
      labelClassName,
      requirementLabel,
      size,
      uncheckedChildren,
      inputRef,
      ...inputProps
    } = this.props;

    const inputClasses = classNames(inputClassName, 'ds-c-choice', {
      'ds-c-choice--inverse': inversed,
      'ds-c-choice--small': size === 'small',
    });

    // Remove props we have our own implementations for
    if (inputProps.id) delete inputProps.id;
    if (inputProps.onChange) delete inputProps.onChange;

    return (
      <div
        className={className}
        aria-live={checkedChildren ? 'polite' : null}
        aria-relevant={checkedChildren ? 'additions text' : null}
        aria-atomic={checkedChildren ? 'false' : null}
      >
        <input
          className={inputClasses}
          id={this.id}
          onChange={this.handleChange}
          disabled={disabled}
          ref={(ref) => {
            this.input = ref;
            if (inputRef) {
              inputRef(ref);
            }
          }}
          {...inputProps}
        />
        <FormLabel
          className={labelClassName}
          fieldId={this.id}
          hint={hint}
          inversed={inversed}
          requirementLabel={requirementLabel}
        >
          {label || children}
        </FormLabel>
        {this.checked() ? checkedChildren : uncheckedChildren}
      </div>
    );
  }
}

Choice.propTypes = {
  /**
   * @hide-prop In order to be consistent with form elements, use `label` instead
   */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Sets the input's `checked` state. Use this in combination with `onChange`
   * for a controlled component; otherwise, set `defaultChecked`.
   */
  checked: PropTypes.bool,
  /**
   * Content to be shown when the choice is checked. See
   * **Checked children and the expose within pattern** on
   * the Guidance tab for detailed instructions.
   */
  checkedChildren: PropTypes.node,
  /**
   * Content to be shown when the choice is not checked
   */
  uncheckedChildren: PropTypes.node,
  /**
   * Additional classes to be added to the root `div` element.
   */
  className: PropTypes.string,
  /**
   * Additional classes to be added to the `input` element.
   */
  inputClassName: PropTypes.string,
  /**
   * Label text or HTML.
   */
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Additional classes to be added to the `FormLabel`.
   */
  labelClassName: PropTypes.string,
  /**
   * Sets the initial `checked` state. Use this for an uncontrolled component;
   * otherwise, use the `checked` property.
   */
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool,
  /**
   * Access a reference to the `input` element
   */
  inputRef: PropTypes.func,
  /**
   * Additional hint text to display below the choice's label
   */
  hint: PropTypes.node,
  /**
   * A unique ID to be used for the input field, as well as the label's
   * `for` attribute. A unique ID will be generated if one isn't provided.
   */
  id: PropTypes.string,
  /**
   * Text showing the requirement ("Required", "Optional", etc.). See [Required and Optional Fields]({{root}}/guidelines/forms/#required-and-optional-fields).
   */
  requirementLabel: PropTypes.node,
  /**
   * Applies the "inverse" UI theme
   */
  inversed: PropTypes.bool,
  size: PropTypes.oneOf(['small']),
  /**
   * The `input` field's `name` attribute
   */
  name: PropTypes.string.isRequired,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  /**
   * Sets the type to render `checkbox` fields or `radio` buttons
   */
  type: PropTypes.oneOf(['checkbox', 'radio']).isRequired,
  /**
   * The `input` `value` attribute
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default Choice;
