import { Tooltip, Image, Box, useMediaQuery } from "@chakra-ui/react";
import query from '../assets/query.png';
import { useState, useRef, useEffect } from 'react';

const TooltipWrapper = ({ label }) => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef();

  const handleTooltipToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (boxRef.current && !boxRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isMobile]);

  return (
    <Tooltip
      label={label}
      aria-label='A tooltip'
      placement='top'
      isOpen={isMobile ? isOpen : undefined}
    >
      <Box
        ref={boxRef}
        onClick={isMobile ? handleTooltipToggle : undefined}
        display='inline-block'
        cursor='pointer'
      >
        <Image borderRadius='full' boxSize='1.2rem' src={query} alt="question mark" />
      </Box>
    </Tooltip>
  );
};

export default TooltipWrapper;
